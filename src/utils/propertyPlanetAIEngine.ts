// propertyPlanetAIEngine.ts
//
// Deterministic, rule-based "AI" response engine for the Property Planet AI assistant
// prototype. It reads ONLY from the existing property_data source (the
// "home_2" records, which already carry verification_status / trust_score /
// suitable_for / last_verified — i.e. the same records rendered in the
// "Featured Opportunities" section on the homepage). No property is
// invented here.
//
// This file has no React/DOM dependency so it is easy to unit-test and easy
// to swap for a real LLM/API call later — the public surface
// (generateAIResponse) intentionally returns the same shape a future
// API-backed implementation would return.

import property_data from "@/data/home-data/PropertyData";

export interface PropertyPlanetProperty {
   id: number;
   title: string;
   address: string;
   price: number;
   price_text?: string;
   property_type?: string;
   verification_status?: string;
   trust_score?: number;
   suitable_for?: string;
   last_verified?: string;
   tag: string;
}

export interface PropertyPlanetAIResponse {
   text: string;
   properties?: PropertyPlanetProperty[];
}

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

// Only the "home_2" records carry the property-intelligence fields
// (verification, trust score, suitable-for, last verified). That is the
// canonical set the assistant is allowed to search and recommend from.
const AI_DATASET: PropertyPlanetProperty[] = property_data
   .filter((item) => item.page === "home_2")
   .map((item) => ({
      id: item.id,
      title: item.title,
      address: item.address,
      price: item.price,
      price_text: item.price_text,
      property_type: item.property_type,
      verification_status: item.verification_status,
      trust_score: item.trust_score,
      suitable_for: item.suitable_for,
      last_verified: item.last_verified,
      tag: item.tag,
   }));

export const getAllProperties = (): PropertyPlanetProperty[] => AI_DATASET;

// Known growth-corridor locations (mirrors the search dropdown + map
// intelligence markers). Used only to recognise a location mentioned in a
// question and to give an honest "not in current listings" answer when no
// property matches.
const KNOWN_LOCATIONS = [
   "future city",
   "mucherla",
   "shamshabad",
   "kollur",
   "maheshwaram",
   "adibatla",
   "shankarpally",
];

// Short, clearly-labelled corridor notes for comparison-style questions.
// Prototype content only — not property listings, so this does not violate
// the "don't invent properties" rule.
const LOCATION_NOTES: Record<string, string> = {
   "future city": "the anchor node of the corridor — the upcoming Future City master-planned zone itself.",
   "mucherla": "immediately adjacent to Future City, currently the most active zone for plotted land and early institutional interest.",
   "shamshabad": "closest to Rajiv Gandhi International Airport, popular for villas and airport-linked commercial use.",
   "kollur": "an established western-corridor residential pocket, generally more developed than the newer southern nodes.",
   "maheshwaram": "on the southern arm of the corridor, positioned for long-horizon land appreciation as infrastructure extends outward.",
   "adibatla": "on NH-44, oriented toward industrial and corporate land parcels rather than residential plots.",
   "shankarpally": "on the western growth belt, currently more villa/residential in character than the southern plot corridor.",
};

// ---------------------------------------------------------------------------
// Filters (composable, deterministic)
// ---------------------------------------------------------------------------

// Matches against both the address AND the title, since a corridor name
// like "Future City" often appears in a listing's title (e.g. "Future City
// Premium Plot") rather than its literal address (e.g. "Mucherla,
// Hyderabad") — both are legitimately "near Future City" for a buyer.
export const filterByLocation = (query: string, data: PropertyPlanetProperty[] = AI_DATASET): PropertyPlanetProperty[] => {
   const q = query.toLowerCase();
   return data.filter((p) => p.address.toLowerCase().includes(q) || p.title.toLowerCase().includes(q));
};

export const filterByType = (type: string, data: PropertyPlanetProperty[] = AI_DATASET): PropertyPlanetProperty[] => {
   const q = type.toLowerCase();
   return data.filter((p) => (p.property_type ?? "").toLowerCase().includes(q));
};

export const filterByVerified = (data: PropertyPlanetProperty[] = AI_DATASET): PropertyPlanetProperty[] =>
   data.filter((p) => p.verification_status === "Verified");

// maxAmount is a plain rupee value (already converted from lakh/crore).
export const filterByBudget = (maxAmount: number, data: PropertyPlanetProperty[] = AI_DATASET): PropertyPlanetProperty[] =>
   data.filter((p) => p.price <= maxAmount);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const LAKH = 100000;
const CRORE = 10000000;

export const formatINR = (amount: number): string => {
   if (amount >= CRORE) return `₹${(amount / CRORE).toFixed(amount % CRORE === 0 ? 0 : 2)} Cr`;
   if (amount >= LAKH) return `₹${(amount / LAKH).toFixed(amount % LAKH === 0 ? 0 : 1)} Lakh`;
   return `₹${amount.toLocaleString("en-IN")}`;
};

// Parses a rupee amount out of free text — handles "₹50L", "50 lakh",
// "1 crore", "1.5cr", "2000000" etc. Returns null if nothing is found.
const parseBudget = (text: string): number | null => {
   const crMatch = text.match(/(\d+(?:\.\d+)?)\s*(cr|crore)/);
   if (crMatch) return parseFloat(crMatch[1]) * CRORE;

   const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(l|lac|lakh|lakhs)\b/);
   if (lakhMatch) return parseFloat(lakhMatch[1]) * LAKH;

   const rawMatch = text.match(/₹?\s*(\d{2,}(?:,\d{2,3})*)\b/);
   if (rawMatch) {
      const val = parseFloat(rawMatch[1].replace(/,/g, ""));
      // Guard against picking up unrelated numbers (e.g. "5 acres").
      if (val >= 100000) return val;
   }
   return null;
};

const findLocation = (text: string): string | null => {
   const q = text.toLowerCase();
   return KNOWN_LOCATIONS.find((loc) => q.includes(loc)) ?? null;
};

const findType = (text: string): string | null => {
   const q = text.toLowerCase();
   if (q.includes("corporate land") || q.includes("industrial")) return "Corporate Land";
   if (q.includes("plot")) return "Plot";
   if (q.includes("land")) return "Land";
   if (q.includes("villa")) return "Villa";
   if (q.includes("apartment") || q.includes("flat")) return "Apartment";
   if (q.includes("commercial")) return "Commercial";
   return null;
};

const summarise = (list: PropertyPlanetProperty[]): string =>
   list
      .map((p) => `${p.title} in ${p.address.split(",")[0]} (${formatINR(p.price)})`)
      .join(", ");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const generateAIResponse = (question: string): PropertyPlanetAIResponse => {
   const q = question.toLowerCase().trim();

   if (!q) {
      return { text: "Ask me about a location, a budget, a property type, or verified opportunities — for example \"plots in Mucherla under ₹1 crore\"." };
   }

   // 1. "Tell me about this property" — no property context in a global widget.
   if (q.includes("this property") || (q.includes("tell me about") && !findLocation(q) && !findType(q))) {
      return {
         text: "Open a specific listing and I can walk you through its verification status, trust score and suitability — or tell me a location, budget or property type and I'll surface matching opportunities here.",
      };
   }

   // 2. Comparison between two known locations.
   if (q.includes("difference between") || q.includes(" vs ") || q.includes(" versus ")) {
      const mentioned = KNOWN_LOCATIONS.filter((loc) => q.includes(loc));
      if (mentioned.length >= 2) {
         const [a, b] = mentioned;
         const propsA = filterByLocation(a);
         const propsB = filterByLocation(b);
         const text =
            `${cap(a)} is ${LOCATION_NOTES[a]} ${cap(b)} is ${LOCATION_NOTES[b]} ` +
            `Currently we have ${propsA.length} listed opportunit${propsA.length === 1 ? "y" : "ies"} in ${cap(a)} and ` +
            `${propsB.length} in ${cap(b)}.`;
         return { text, properties: [...propsA, ...propsB] };
      }
   }

   // 3. Proximity to upcoming infrastructure (NH-44, ORR, airport, Future City).
   if (q.includes("infrastructure") || q.includes("closest") || q.includes("nearest")) {
      return {
         text: `Future City itself is the anchor node of the corridor. ${cap("mucherla")} sits immediately next to it on the NH-44 / Bangalore Highway belt, while ${cap("adibatla")} is the industrial node further along NH-44 and ${cap("shamshabad")} is closest to Rajiv Gandhi International Airport. These are generally the areas closest to confirmed infrastructure right now.`,
         properties: filterByLocation("future city").concat(filterByLocation("mucherla")).concat(filterByLocation("adibatla")).filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i),
      };
   }

   // 4. Best-for-investment / good investment areas.
   if (q.includes("investment") || q.includes("invest")) {
      const investable = AI_DATASET.filter((p) => (p.suitable_for ?? "").toLowerCase().includes("investor"))
         .sort((a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0));
      if (investable.length === 0) {
         return { text: "I couldn't find a matching property in the current listings for investment-focused buyers right now." };
      }
      return {
         text: `Based on verification status and trust score, the strongest investor-suited opportunities right now are: ${summarise(investable)}.`,
         properties: investable,
      };
   }

   // 5. Verified properties.
   if (q.includes("verified") || q.includes("verification")) {
      const verified = filterByVerified();
      if (verified.length === 0) {
         return { text: "I couldn't find any fully verified listings in the current data set — some may still be under review." };
      }
      return { text: `Here ${verified.length === 1 ? "is" : "are"} our currently verified opportunit${verified.length === 1 ? "y" : "ies"}, each backed by a trust score.`, properties: verified };
   }

   // 6. Price range for a location.
   if (q.includes("price range") || (q.includes("price") && findLocation(q))) {
      const loc = findLocation(q);
      const pool = loc ? filterByLocation(loc) : AI_DATASET;
      if (pool.length === 0) {
         return { text: `I couldn't find a matching property in the current listings for ${loc ? cap(loc) : "that area"}. Try expanding the location.` };
      }
      const prices = pool.map((p) => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return {
         text: `${loc ? cap(loc) : "Current listed"} opportunities range from ${formatINR(min)} to ${formatINR(max)} in our current listings.`,
         properties: pool,
      };
   }

   // 7. Budget-driven query, e.g. "I have a budget of ₹50 lakh. What can I buy?"
   const budget = parseBudget(q);
   if (budget !== null) {
      const withinBudget = filterByBudget(budget);
      if (withinBudget.length === 0) {
         return { text: `I couldn't find a matching property in the current listings under ${formatINR(budget)}. Try increasing your budget or expanding the location.` };
      }
      return {
         text: `Within ${formatINR(budget)}, here ${withinBudget.length === 1 ? "is" : "are"} ${withinBudget.length} matching opportunit${withinBudget.length === 1 ? "y" : "ies"}.`,
         properties: withinBudget,
      };
   }

   // 8. Location-driven query, e.g. "What plots are available in Mucherla?"
   const loc = findLocation(q);
   const type = findType(q);
   if (loc || type) {
      let pool = AI_DATASET;
      if (loc) pool = filterByLocation(loc, pool);
      if (type) pool = filterByType(type, pool);

      if (pool.length === 0) {
         const where = loc ? cap(loc) : "";
         const what = type ? type.toLowerCase() : "properties";
         return {
            text: `I couldn't find a matching property in the current listings for ${what}${where ? ` in ${where}` : ""}. Try increasing your budget or expanding the location.`,
         };
      }
      return {
         text: `I found ${pool.length} matching opportunit${pool.length === 1 ? "y" : "ies"}${loc ? ` in ${cap(loc)}` : ""}.`,
         properties: pool,
      };
   }

   // 9. "Show me plots" / generic listing / show properties.
   if (q.includes("show me") || q.includes("plots") || q.includes("properties") || q.includes("available")) {
      return { text: `Here ${AI_DATASET.length === 1 ? "is" : "are"} our currently listed, verified-in-progress opportunities.`, properties: AI_DATASET };
   }

   // 10. Fallback — nudge toward what the assistant can actually do.
   return {
      text: "I can help with locations (Future City, Mucherla, Shamshabad, Kollur, Maheshwaram, Adibatla, Shankarpally), budget, property type, or verified listings. Try something like \"plots under ₹1 crore in Mucherla\".",
   };
};

const cap = (s: string): string => s.replace(/\b\w/g, (c) => c.toUpperCase());
