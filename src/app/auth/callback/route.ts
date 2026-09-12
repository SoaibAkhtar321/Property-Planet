// src/app/auth/callback/route.ts
//
// Server-side landing point for Supabase's OAuth redirect (Google login for
// buyers). Exchanges the ?code= for a session cookie, then routes based on
// `profiles.role` -- never on anything the client/URL claims. A brand-new
// Google sign-in always lands here as role 'buyer' (see 0011's
// handle_new_user()), so in practice this only ever sends people to
// /dashboard/dashboard-index, but it re-checks the real column anyway
// rather than assuming, exactly like LoginForm's existing post-login logic.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
   const { searchParams, origin } = new URL(request.url);
   const code = searchParams.get("code");
   const errorDescription = searchParams.get("error_description");

   if (errorDescription) {
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorDescription)}`);
   }

   if (!code) {
      return NextResponse.redirect(`${origin}/`);
   }

   const supabase = await createClient();
   const { error } = await supabase.auth.exchangeCodeForSession(code);

   if (error) {
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
   }

   const {
      data: { user },
   } = await supabase.auth.getUser();

   let destination = "/dashboard/dashboard-index";

   if (user) {
      const { data: profile } = await supabase
         .from("profiles")
         .select("role")
         .eq("id", user.id)
         .maybeSingle();

      if (profile?.role === "admin") {
         destination = "/admin";
      }
   }

   return NextResponse.redirect(`${origin}${destination}`);
}
