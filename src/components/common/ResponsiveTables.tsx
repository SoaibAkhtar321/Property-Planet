"use client";

// Phones: admin/seller tables (5-7 columns) used to be clipped so the
// status and action buttons sat off-screen. This copies each column's
// header text onto its cells as data-label, which _mobile.scss uses to
// render every row as a stacked, labelled card below 768px. Runs on mount
// and whenever table content changes (filters, pagination, row actions).

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function labelTables(root: ParentNode) {
   root.querySelectorAll<HTMLTableElement>(".dashboard-body table").forEach((table) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map((th) => (th.textContent ?? "").trim());
      if (headers.length === 0) return;
      table.querySelectorAll("tbody tr").forEach((row) => {
         Array.from(row.children).forEach((cell, i) => {
            const label = headers[i];
            if (label && !cell.hasAttribute("data-label")) cell.setAttribute("data-label", label);
         });
      });
   });
}

export default function ResponsiveTables() {
   const pathname = usePathname();
   useEffect(() => {
      // Only touch the DOM once React has finished hydrating it: admin pages
      // stream in after this component mounts, and adding attributes to
      // not-yet-hydrated markup causes a hydration mismatch (which made
      // React redraw the page and drop the dark theme). Wait for the page
      // load, then an idle tick; later client-side updates are safe.
      let observer: MutationObserver | null = null;
      let cancelled = false;
      const start = () => {
         if (cancelled) return;
         labelTables(document);
         observer = new MutationObserver(() => labelTables(document));
         observer.observe(document.body, { childList: true, subtree: true });
      };
      const idle = () =>
         typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 300);
      if (document.readyState === "complete") idle();
      else window.addEventListener("load", idle, { once: true });
      return () => {
         cancelled = true;
         window.removeEventListener("load", idle);
         observer?.disconnect();
      };
   }, [pathname]);
   return null;
}
