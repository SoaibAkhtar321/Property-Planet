"use server";

// src/lib/favourites/actions.ts
//
// Buyer/User dashboard: Favourites. Mirrors src/lib/leads/actions.ts's
// pattern — requireDashboardUser() first, write through the
// RLS-respecting createClient() (never a service client), return a
// plain ActionResult instead of throwing. user_id is always taken from
// the session, never from client input.

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth/session";
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

   // Note: intentionally getAuthContext() here, not requireDashboardUser().
   // requireDashboardUser() calls redirect(), which throws a special
   // navigation signal that Next.js intercepts before it reaches this
   // action's caller when the action is invoked directly (as it is here,
   // from a button onClick) rather than via a <form action>. That left the
   // client's `await addFavourite(...)` resolving to `undefined` instead
   // of an ActionResult, crashing on `result.success`. Checking auth
   // without redirecting lets this always return a real ActionResult.
   const ctx = await getAuthContext();
   if (!ctx) {
      return { success: false, error: "Sign in to save favourites." };
   }
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

   const ctx = await getAuthContext();
   if (!ctx) {
      return { success: false, error: "Sign in to save favourites." };
   }
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
