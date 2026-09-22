"use server";

// src/lib/ai/actions.ts
//
// Server-side backing for the Property Planet AI widget.
//
// Data source: the public `property_public` view, read through the normal
// RLS-respecting createClient() — never a service-role client, and no
// credential ever reaches the browser. That view is published-only and has no
// seller contact, exact location, lead or buyer columns, so the assistant
// structurally cannot see (or leak) them. The query also applies the same
// rules as the public /properties listing: sale only (no rentals) and
// individual properties only (project_id is null; project units belong to
// their project page).
//
// There is no external AI provider: answers come from the deterministic
// engine in src/utils/propertyPlanetAIEngine.ts over this real data.

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPublicSiteReraCertificate } from "@/lib/site/queries";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from "@/lib/site/contact";
import { priceUnitSuffix } from "@/lib/properties/priceUnit";
import {
   generateAIResponse,
   type PropertyPlanetAIResponse,
   type PropertyPlanetProperty,
} from "@/utils/propertyPlanetAIEngine";

const MAX_QUESTION_LENGTH = 300;
const DATASET_LIMIT = 200;

// Best-effort abuse guard: at most RATE_LIMIT_MAX questions per client IP per
// minute. It is in-memory, so on serverless hosting each instance keeps its
// own counter — it slows a runaway loop, it is not a hard global quota.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const hitsByClient = new Map<string, number[]>();

function isRateLimited(clientId: string): boolean {
   const now = Date.now();
   const recent = (hitsByClient.get(clientId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
   if (recent.length >= RATE_LIMIT_MAX) {
      hitsByClient.set(clientId, recent);
      return true;
   }
   recent.push(now);
   hitsByClient.set(clientId, recent);
   // Keep the map from growing without bound.
   if (hitsByClient.size > 5000) {
      for (const [key, times] of hitsByClient) {
         if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hitsByClient.delete(key);
      }
   }
   return false;
}

const UNAVAILABLE_MESSAGE = `I couldn't load the current listings just now. Please try again in a moment, or call ${CONTACT_PHONE_DISPLAY} / email ${CONTACT_EMAIL}.`;

interface AIPropertyRow {
   id: string;
   title: string;
   slug: string;
   property_type: string;
   price: number | string;
   price_unit: string | null;
   price_unit_label: string | null;
   area: number | string | null;
   area_unit: string | null;
   city: string;
   locality: string;
}

export async function askPropertyPlanetAI(question: string): Promise<PropertyPlanetAIResponse> {
   if (typeof question !== "string") {
      return { text: "Please type a question." };
   }
   const trimmed = question.trim().slice(0, MAX_QUESTION_LENGTH);
   if (!trimmed) {
      return { text: "Ask me about a location, a budget or a property type." };
   }

   const h = await headers();
   const clientId = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
   if (isRateLimited(clientId)) {
      return {
         text: `You're asking quite fast — please wait a moment and try again. For anything urgent, call ${CONTACT_PHONE_DISPLAY} or email ${CONTACT_EMAIL}.`,
      };
   }

   const supabase = await createClient();
   const { data, error } = await supabase
      .from("property_public")
      .select("id, title, slug, property_type, price, price_unit, price_unit_label, area, area_unit, city, locality")
      .is("project_id", null)
      .eq("listing_type", "sale")
      .order("published_at", { ascending: false })
      .limit(DATASET_LIMIT);

   if (error) {
      console.error("AI assistant failed to load listings:", error.message);
      return { text: UNAVAILABLE_MESSAGE };
   }

   // A row without a usable price is skipped rather than shown as ₹0 — the
   // assistant never states a price the listing doesn't actually have.
   const dataset: PropertyPlanetProperty[] = [];
   for (const row of (data ?? []) as AIPropertyRow[]) {
      const price = Number(row.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      const area = row.area === null ? null : Number(row.area);
      dataset.push({
         id: row.id,
         title: row.title,
         slug: row.slug,
         propertyType: row.property_type,
         price,
         // Shared formatter/vocabulary, same one every other price-display
         // surface uses -- undefined (not "") for an unlabeled/total-price
         // row so the widget's `p.priceUnit &&` check works the same way as
         // PropertyCard.tsx's.
         priceUnit: priceUnitSuffix(row.price_unit, row.price_unit_label) || undefined,
         city: row.city,
         locality: row.locality,
         areaText: area !== null && Number.isFinite(area) && row.area_unit ? `${area} ${row.area_unit}` : undefined,
      });
   }

   // Only true when an admin has actually uploaded the site RERA certificate,
   // so the assistant never claims a registration that isn't shown on the site.
   const certificate = await getPublicSiteReraCertificate();

   return generateAIResponse(trimmed, dataset, { hasReraCertificate: certificate !== null });
}
