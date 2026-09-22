"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "pp-theme";

function getSystemDark(): boolean {
   if (typeof window === "undefined") return false;
   return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(pref: ThemePreference): "light" | "dark" {
   if (pref === "dark") return "dark";
   if (pref === "light") return "light";
   return getSystemDark() ? "dark" : "light";
}

function applyResolved(resolved: "light" | "dark") {
   const root = document.documentElement;
   root.setAttribute("data-theme", resolved);
   root.style.colorScheme = resolved;
}

function readPreference(): ThemePreference {
   try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
   } catch {
      /* ignore */
   }
   return "system";
}

/**
 * Three-state theme control: Light | Dark | System.
 * Preference persists in localStorage; System follows prefers-color-scheme.
 */
const ThemeToggle = () => {
   const [pref, setPref] = useState<ThemePreference>("system");
   const [open, setOpen] = useState(false);
   const [mounted, setMounted] = useState(false);
   const rootRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const initial = readPreference();
      setPref(initial);
      applyResolved(resolveTheme(initial));
      setMounted(true);
   }, []);

   useEffect(() => {
      if (!mounted || pref !== "system") return;
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => applyResolved(resolveTheme("system"));
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
   }, [mounted, pref]);

   useEffect(() => {
      if (!open) return;
      const onDoc = (e: MouseEvent) => {
         if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
            setOpen(false);
         }
      };
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
      return () => {
         document.removeEventListener("mousedown", onDoc);
         document.removeEventListener("keydown", onKey);
      };
   }, [open]);

   const choose = useCallback((next: ThemePreference) => {
      setPref(next);
      try {
         localStorage.setItem(STORAGE_KEY, next);
      } catch {
         /* ignore */
      }
      applyResolved(resolveTheme(next));
      setOpen(false);
   }, []);

   const resolved = mounted ? resolveTheme(pref) : "light";
   const iconClass =
      pref === "system"
         ? "bi bi-circle-half"
         : resolved === "dark"
           ? "bi bi-moon-stars-fill"
           : "bi bi-sun-fill";

   const label =
      pref === "system" ? "System theme" : pref === "dark" ? "Dark theme" : "Light theme";

   return (
      <div className="pp-theme-toggle" ref={rootRef}>
         <button
            type="button"
            className="pp-theme-toggle__btn"
            aria-label={label}
            aria-haspopup="listbox"
            aria-expanded={open}
            title={label}
            onClick={() => setOpen((v) => !v)}
         >
            <i className={iconClass} aria-hidden="true" />
         </button>
         {open && (
            <ul className="pp-theme-toggle__menu" role="listbox" aria-label="Theme">
               <li role="option" aria-selected={pref === "light"}>
                  <button
                     type="button"
                     className={`pp-theme-toggle__option${pref === "light" ? " is-active" : ""}`}
                     onClick={() => choose("light")}
                  >
                     <i className="bi bi-sun-fill" aria-hidden="true" />
                     Light
                  </button>
               </li>
               <li role="option" aria-selected={pref === "dark"}>
                  <button
                     type="button"
                     className={`pp-theme-toggle__option${pref === "dark" ? " is-active" : ""}`}
                     onClick={() => choose("dark")}
                  >
                     <i className="bi bi-moon-stars-fill" aria-hidden="true" />
                     Dark
                  </button>
               </li>
               <li role="option" aria-selected={pref === "system"}>
                  <button
                     type="button"
                     className={`pp-theme-toggle__option${pref === "system" ? " is-active" : ""}`}
                     onClick={() => choose("system")}
                  >
                     <i className="bi bi-circle-half" aria-hidden="true" />
                     System
                  </button>
               </li>
            </ul>
         )}
      </div>
   );
};

export default ThemeToggle;
