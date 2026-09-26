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
   // Phase 20: where to land after a successful exchange, when the sign-in
   // was started from somewhere that must be returned to — specifically the
   // universal inquiry flow, which sends the buyer to Google mid-enquiry and
   // needs them back on the same property/project to finish it.
   //
   // Open-redirect safety: only a same-origin RELATIVE path is honoured. A
   // value must start with a single "/" and must not start with "//" or
   // "/\\" (protocol-relative URLs, which browsers treat as absolute), so
   // "?next=https://evil.example" and "?next=//evil.example" are both
   // ignored and fall through to the normal role-based destination.
   const nextParam = searchParams.get("next");
   const errorDescription = searchParams.get("error_description");

   // Phase 4: the password-recovery link (ForgotPasswordForm) is routed
   // through this same callback with ?next=/auth/reset-password, so it can
   // reuse this route's exchangeCodeForSession() instead of relying on
   // detectSessionInUrl on the reset-password page itself (that mismatch --
   // a PKCE `?code=` link with no explicit exchange -- was the actual cause
   // of the "Supabase auth session expired" bug). A recovery link that is
   // expired or already used must not bounce to the homepage like an OAuth
   // failure does; it needs to send the person back to request a fresh one,
   // with a message, on /auth/forgot-password.
   const isRecovery = nextParam === "/auth/reset-password";

   if (errorDescription) {
      if (isRecovery) {
         return NextResponse.redirect(
            `${origin}/auth/forgot-password?reset_error=${encodeURIComponent(errorDescription)}`
         );
      }
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorDescription)}`);
   }

   if (!code) {
      if (isRecovery) {
         return NextResponse.redirect(`${origin}/auth/forgot-password?reset_error=Invalid or missing reset link.`);
      }
      return NextResponse.redirect(`${origin}/`);
   }

   const supabase = await createClient();
   const { error } = await supabase.auth.exchangeCodeForSession(code);

   if (error) {
      if (isRecovery) {
         return NextResponse.redirect(
            `${origin}/auth/forgot-password?reset_error=${encodeURIComponent(error.message)}`
         );
      }
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
   }

   if (isRecovery) {
      // Session cookie is now set (createClient() above wrote it via the
      // response cookie jar) -- the reset-password page's own server/client
      // Supabase reads will see it as an active session, no further
      // exchange needed there.
      return NextResponse.redirect(`${origin}/auth/reset-password`);
   }

   const {
      data: { user },
   } = await supabase.auth.getUser();

   const safeNext =
      nextParam && /^\/(?![/\\])/.test(nextParam) ? nextParam : null;

   let destination = "/dashboard/dashboard-index";

   if (user) {
      const { data: profile } = await supabase
         .from("profiles")
         .select("role, phone")
         .eq("id", user.id)
         .maybeSingle();

      if (safeNext) {
         // An explicit return target wins for every role. Note this does not
         // grant access to anything: /dashboard/** and /admin/** are still
         // gated by src/middleware.ts and requireDashboardUser() on the
         // request that follows, so an unauthorized "next" simply bounces.
         //
         // The phone-completion redirect below is deliberately skipped in
         // this case: a buyer returning mid-enquiry is about to submit a
         // phone number in the inquiry form itself, and createInquiry()
         // backfills profiles.phone from it (see inquiryInput.ts). Sending
         // them to /auth/complete-profile here would ask for the same number
         // twice and lose the enquiry — the exact dashboard detour this
         // change exists to remove.
         destination = safeNext;
      } else if (profile?.role === "admin") {
         destination = "/admin";
      } else if (profile?.role === "buyer" && !profile.phone) {
         destination = "/auth/complete-profile";
      }
   }

   return NextResponse.redirect(`${origin}${destination}`);
}
