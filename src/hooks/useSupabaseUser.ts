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
      };

      supabase.auth.getUser().then(({ data }) => loadProfile(data.user));

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
         loadProfile(session?.user ?? null);
      });

      return () => {
         isMounted = false;
         subscription.subscription.unsubscribe();
      };
   }, []);

   return state;
}
