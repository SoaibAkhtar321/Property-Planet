"use client"
// src/hooks/useSupabaseUser.ts
//
// Phase 1: client-side session state for UI presentation only (e.g. what
// the header shows). This is NEVER used for authorization — every actual
// access-control decision is made server-side in src/middleware.ts and
// src/lib/auth/session.ts, which re-derive role from `profiles` on every
// request. This hook exists purely so the header can show the right
// links without a full page reload.
//
// Uses supabase.auth.onAuthStateChange (event-driven), not polling, so it
// stays in sync across login, logout, and token refresh without extra
// requests.

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "buyer" | "seller" | "admin";

interface SupabaseUserState {
   user: User | null;
   role: UserRole | null;
   fullName: string | null;
   loading: boolean;
}

export function useSupabaseUser(): SupabaseUserState {
   const [state, setState] = useState<SupabaseUserState>({
      user: null,
      role: null,
      fullName: null,
      loading: true,
   });

   useEffect(() => {
      const supabase = createClient();
      let isMounted = true;

      const loadProfile = async (user: User | null) => {
         if (!user) {
            if (isMounted) setState({ user: null, role: null, fullName: null, loading: false });
            return;
         }

         try {
            const { data: profile } = await supabase
               .from("profiles")
               .select("role, full_name")
               .eq("id", user.id)
               .maybeSingle();

            if (!isMounted) return;
            setState({
               user,
               role: (profile?.role as UserRole) ?? null,
               fullName: profile?.full_name ?? null,
               loading: false,
            });
         } catch {
            // Profile fetch failed (network hiccup, etc.) — still resolve
            // loading so UI gated on `loading` (e.g. the inquiry button)
            // doesn't stay hidden forever. Treat as a signed-in user with
            // an unknown role rather than silently hanging.
            if (isMounted) setState({ user, role: null, fullName: null, loading: false });
         }
      };

      supabase.auth
         .getUser()
         .then(({ data }) => loadProfile(data.user))
         .catch(() => {
            // getUser() itself failed — resolve as logged-out rather than
            // leaving `loading: true` forever, which was silently hiding
            // the "Send Inquiry" button (and everything else gated on
            // this hook) with no visible error.
            if (isMounted) setState({ user: null, role: null, fullName: null, loading: false });
         });

      // Belt-and-braces: if the request above hangs (flaky network) rather
      // than resolving or rejecting, don't leave the UI stuck on `loading`
      // indefinitely.
      const timeout = window.setTimeout(() => {
         if (isMounted) {
            setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
         }
      }, 6000);

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
         loadProfile(session?.user ?? null);
      });

      return () => {
         isMounted = false;
         window.clearTimeout(timeout);
         subscription.subscription.unsubscribe();
      };
   }, []);

   return state;
}