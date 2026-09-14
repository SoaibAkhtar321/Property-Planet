"use server";

// src/lib/favourites/actions.ts
//
// Buyer/User dashboard: Favourites. Mirrors src/lib/leads/actions.ts's
// pattern — requireDashboardUser() first, write through the
// RLS-respecting createClient() (never a service client), return a
// plain ActionResult instead of throwing. user_id is always taken from
// the session, never from client input.

import { revalidatePath } from "next/cache";
import { requireDashboardUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
   success: boolean;
   error?: string;
}

/** Adds a property to the caller's favourites. Re-validates the property is real and published. */
export async function addFavourite(propertyId: string): Promise<ActionResult> {
   if (!propertyId || typeof propertyId !== "string") {
      return { success: false, error: "A property is required." };
   }

   const ctx = await requireDashboardUser();
   const supabase = await createClient();

   const { data: property, error: propertyError } = await supabase
      .from("property_public")
      .select("id")
      .eq("id", propertyId)
      .maybeSingle();

   if (propertyError || !property) {
      return { success: false, error: "This property is no longer available." };
   }

   const { error: insertError } = await supabase.from("favourites").insert({
      user_id: ctx.userId,
      property_id: propertyId,
   });

   // Unique-violation just means it's already a favourite — treat as success.
   if (insertError && insertError.code !== "23505") {
      return { success: false, error: "Failed to save favourite. Please try again." };
   }

   revalidatePath("/dashboard/favourites");
   revalidatePath("/dashboard/dashboard-index");
   return { success: true };
}

/** Removes a property from the caller's favourites. */
export async function removeFavourite(propertyId: string): Promise<ActionResult> {
   if (!propertyId || typeof propertyId !== "string") {
      return { success: false, error: "A property is required." };
   }

   const ctx = await requireDashboardUser();
   const supabase = await createClient();

   const { error } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", ctx.userId)
      .eq("property_id", propertyId);

   if (error) {
      return { success: false, error: "Failed to remove favourite. Please try again." };
   }

   revalidatePath("/dashboard/favourites");
   revalidatePath("/dashboard/dashboard-index");
   return { success: true };
}

/** Returns the ids of every property the caller has favourited. Empty (never throws) if not signed in. */
export async function getMyFavouriteIds(): Promise<string[]> {
   const supabase = await createClient();
   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (!user) return [];

   const { data, error } = await supabase
      .from("favourites")
      .select("property_id")
      .eq("user_id", user.id);

   if (error || !data) return [];
   return data.map((row) => row.property_id as string);
}
