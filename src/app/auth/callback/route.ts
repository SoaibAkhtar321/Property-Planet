// src/app/auth/callback/route.ts
//
// Server-side landing point for Supabase's OAuth redirect (Google login for
// buyers). Exchanges the ?code= for a session cookie, then routes based on
// `profiles.role`/`profiles.phone` -- never on anything the client/URL
// claims. A brand-new Google sign-in always lands here as role 'buyer'
// with phone still null (see 0011/0012's handle_new_user() -- Google OAuth
// never supplies a phone), so this sends first-time buyers to
// /auth/complete-profile instead of the dashboard. This is a convenience
// fast-path only, not the actual enforcement -- src/middleware.ts and
// requireDashboardUser() (src/lib/auth/session.ts) independently redirect
// there too for any /dashboard/** request or buyer-only action, so a
// buyer can't reach anywhere gated by phone completion even if this route
// were skipped or its logic were wrong.

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
         .select("role, phone")
         .eq("id", user.id)
         .maybeSingle();

      if (profile?.role === "admin") {
         destination = "/admin";
      } else if (profile?.role === "buyer" && !profile.phone) {
         destination = "/auth/complete-profile";
      }
   }

   return NextResponse.redirect(`${origin}${destination}`);
}
