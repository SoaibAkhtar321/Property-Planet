// src/lib/leads/queries.ts
//
// Buyer/User dashboard Messages section: read-only query for the caller's
// own enquiries (`leads`). Mirrors the read side of src/lib/leads/actions.ts
// — identity always from the session, RLS ("buyers can read own leads",
// 0004_leads_site_visits_reveals.sql) is the actual boundary.
//
// Property titles are joined through `property_public`, not `properties`,
// since a buyer has no RLS grant to read a property row once it stops being
// published (sold/archived/etc). That means an enquiry on a listing that's
// since come off the market shows no title here — this deliberately does
// not fabricate one.

import { createClient } from "@/lib/supabase/server";

export type LeadStatus = "new" | "contacted" | "qualified" | "site_visit" | "negotiation" | "closed" | "lost";

export interface MyEnquiry {
   id: string;
   status: LeadStatus;
   message: string | null;
   createdAt: string;
   propertyId: string | null;
   propertyTitle: string | null;
   propertySlug: string | null;
   projectId: string | null;
   projectTitle: string | null;
   projectSlug: string | null;
}

/** The caller's own enquiries (leads), newest first. Empty (never throws) if not signed in. */
export async function getMyEnquiries(): Promise<MyEnquiry[]> {
   const supabase = await createClient();
   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (!user) return [];

   const { data: leads, error } = await supabase
      .from("leads")
      .select("id, status, message, created_at, property_id, project_id")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

   if (error || !leads || leads.length === 0) {
      return [];
   }

   const propertyIds = leads.map((l) => l.property_id).filter((id): id is string => Boolean(id));

   const titleByPropertyId = new Map<string, { title: string; slug: string }>();
   if (propertyIds.length > 0) {
      const { data: properties } = await supabase
         .from("property_public")
         .select("id, title, slug")
         .in("id", propertyIds);

      for (const p of properties ?? []) {
         titleByPropertyId.set(p.id, { title: p.title, slug: p.slug });
      }
   }

   const projectIds = leads.map((l) => l.project_id).filter((id): id is string => Boolean(id));

   const titleByProjectId = new Map<string, { title: string; slug: string }>();
   if (projectIds.length > 0) {
      const { data: projects } = await supabase
         .from("project_public")
         .select("id, title, slug")
         .in("id", projectIds);

      for (const p of projects ?? []) {
         titleByProjectId.set(p.id, { title: p.title, slug: p.slug });
      }
   }

   return leads.map((lead) => {
      const property = lead.property_id ? titleByPropertyId.get(lead.property_id) : undefined;
      const project = lead.project_id ? titleByProjectId.get(lead.project_id) : undefined;
      return {
         id: lead.id,
         status: lead.status as LeadStatus,
         message: lead.message,
         createdAt: lead.created_at,
         propertyId: lead.property_id,
         propertyTitle: property?.title ?? null,
         propertySlug: property?.slug ?? null,
         projectId: lead.project_id,
         projectTitle: project?.title ?? null,
         projectSlug: project?.slug ?? null,
      };
   });
}
