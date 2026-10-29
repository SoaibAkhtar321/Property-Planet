// src/lib/site/jsonLd.ts
//
// The ONLY way JSON-LD should be written into a <script> tag on this site.
//
// JSON.stringify() does not escape "<", so any string field that reaches a
// JSON-LD block (a property title, a project overview, a blog excerpt, a
// breadcrumb name) containing "</script><script>..." would close the
// script element and run attacker HTML on a public page. Property titles
// are seller-controlled and editable after approval, so this is a real
// stored-XSS path, not a theoretical one (security audit, 2026-10).
//
// Escaping < > & and the two JS line terminators as \uXXXX keeps the JSON
// semantically identical for search engines while making it impossible to
// break out of the script element.

export function serializeJsonLd(data: unknown): string {
   return JSON.stringify(data)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(new RegExp("\\u2028", "g"), "\\u2028")
      .replace(new RegExp("\\u2029", "g"), "\\u2029");
}
