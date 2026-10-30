"use client";

// Keeps <html data-theme> set for the whole session.
//
// The inline script in app/layout.tsx sets data-theme before first paint,
// but React 19 resets the attributes of the root <html> element whenever
// the root layout re-renders (seen on admin pages after a session refresh),
// which silently dropped dark mode back to light. This re-applies the saved
// preference whenever the attribute disappears. It never changes the user's
// choice — ThemeToggle.tsx still owns that.

import { useEffect } from "react";

const STORAGE_KEY = "pp-theme";

function resolved(): "light" | "dark" {
   let pref = "system";
   try {
      pref = localStorage.getItem(STORAGE_KEY) || "system";
   } catch {
      /* storage blocked: follow the system */
   }
   if (pref === "dark" || pref === "light") return pref;
   return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeGuard() {
   useEffect(() => {
      const root = document.documentElement;
      const ensure = () => {
         if (root.getAttribute("data-theme")) return;
         const theme = resolved();
         root.setAttribute("data-theme", theme);
         root.style.colorScheme = theme;
      };
      ensure();
      const observer = new MutationObserver(ensure);
      observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
      return () => observer.disconnect();
   }, []);
   return null;
}
