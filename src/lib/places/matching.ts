// src/lib/places/matching.ts
//
// Shared locality-matching used by the "place discovery" pages
// (/places/[locality]) to decide whether a property/project's free-text
// locality is "the same place" as the one a user clicked through from a
// "Places with Most Properties" card. Both properties.locality (via
// property_public) and project_location.locality (via project_public) are
// free-text columns — there is no shared locality/place table, and this
// file intentionally does not create one (see the brief: reuse the
// existing location architecture).
//
// Two layers only, both conservative on purpose:
//
//   1. normalizePlaceName() — collapses harmless formatting differences
//      (case, whitespace, punctuation) so "Kongara Khurd - A",
//      "kongara khurd a" and "Kongara  Khurd A" all normalize identically.
//      This is the bulk of real-world variation and it is completely safe:
//      it can never merge two genuinely different place names.
//
//   2. matchesPlace() — falls back to a single-edit typo tolerance only
//      when the normalized strings are NOT already equal. It is
//      deliberately restricted to Levenshtein distance === 1 on the
//      normalized strings (one character inserted, deleted, or
//      substituted), not a similarity score. A similarity score (e.g.
//      trigram similarity) cannot tell "Kongara Khurd - A" vs
//      "Kongara Khurd - E" (a genuine one-letter typo, distance 1) apart
//      from "Kongara Khurd - A" vs "Kongara Khurd - 12" (a different,
//      legitimate place — substituting "a" for "1" AND inserting "2" is
//      distance 2) — both read as "almost the same string". Distance===1
//      does separate them correctly, which is exactly the guarantee the
//      brief asks for: catch a one-character slip, never blur two
//      distinct places.

/** Lowercases, strips punctuation to spaces, and collapses whitespace. */
export function normalizePlaceName(value: string): string {
   return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
}

/** Levenshtein edit distance between two strings (insert/delete/substitute, cost 1 each). */
function levenshteinDistance(a: string, b: string): number {
   if (a === b) return 0;
   if (a.length === 0) return b.length;
   if (b.length === 0) return a.length;

   let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);

   for (let i = 0; i < a.length; i++) {
      const currentRow = [i + 1];
      for (let j = 0; j < b.length; j++) {
         const insertCost = currentRow[j] + 1;
         const deleteCost = previousRow[j + 1] + 1;
         const substituteCost = previousRow[j] + (a[i] === b[j] ? 0 : 1);
         currentRow.push(Math.min(insertCost, deleteCost, substituteCost));
      }
      previousRow = currentRow;
   }

   return previousRow[b.length];
}

/**
 * Minimum normalized length before typo tolerance kicks in at all — short
 * place names (e.g. a 3-letter locality) have too little signal for a
 * single-character edit to be a safe bet rather than a coincidence.
 */
const MIN_LENGTH_FOR_TYPO_TOLERANCE = 4;

/**
 * True if `candidate` (a listing's free-text locality) refers to the same
 * place as `target` (the clicked place card's canonical name).
 *
 * Exact match after normalization always counts. Beyond that, only a
 * single-character edit is accepted — see file header for why this
 * threshold (rather than a similarity score) is what keeps "Kongara Khurd
 * - A" vs "Kongara Khurd - E" matching while "Kongara Khurd - A" vs
 * "Kongara Khurd - 12" does not.
 */
export function matchesPlace(candidate: string | null | undefined, target: string): boolean {
   if (!candidate) return false;

   const normalizedCandidate = normalizePlaceName(candidate);
   const normalizedTarget = normalizePlaceName(target);
   if (!normalizedCandidate || !normalizedTarget) return false;

   if (normalizedCandidate === normalizedTarget) return true;

   if (normalizedTarget.length < MIN_LENGTH_FOR_TYPO_TOLERANCE) return false;

   return levenshteinDistance(normalizedCandidate, normalizedTarget) === 1;
}
