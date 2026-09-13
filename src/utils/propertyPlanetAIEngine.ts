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

// ---------------------------------------------------------------------------
// Keyword understanding
// ---------------------------------------------------------------------------
//
// A lightweight synonym layer so the assistant reacts to how people actually
// phrase things ("cheap", "genuine", "EMI", "tour") instead of only the exact
// words used in the four canned suggestion chips. Still fully rule-based —
// no external API — but it lets one question carry several signals at once
// (location + type + budget + verified) instead of matching only the first
// branch that happens to fire.

const GREETING_WORDS = ["hi", "hello", "hey", "hii", "helo", "yo", "namaste"];
const THANKS_WORDS = ["thanks", "thank you", "thnx", "thx", "ty"];

const INVESTMENT_WORDS = ["invest", "investment", "returns", "appreciation", "roi", "resale"];
const VERIFIED_WORDS = ["verified", "verification", "genuine", "authentic", "trusted", "trust", "safe", "legit", "legal check", "clear title"];
const CHEAP_WORDS = ["cheap", "affordable", "budget-friendly", "lowest price", "low budget"];
const LOAN_WORDS = ["loan", "emi", "finance", "financing", "mortgage", "bank loan"];
const VISIT_WORDS = ["site visit", "book a visit", "schedule a visit", "site tour", "visit the site", "book visit"];
const CORRIDOR_WORDS = ["future city corridor", "what is future city", "about future city", "corridor mean", "what is the corridor"];
const COMPARE_TYPE_WORDS = ["plots vs villas", "plot vs villa", "plot or villa", "villa or plot", "which is better"];

const includesAny = (q: string, words: string[]): boolean =>
   words.some((w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(q));

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const generateAIResponse = (question: string): PropertyPlanetAIResponse => {
   const q = question.toLowerCase().trim();

   if (!q) {
      return { text: "Ask me about a location, a budget, a property type, or verified opportunities — for example \"plots in Mucherla under ₹1 crore\"." };
   }

   // 0a. Greeting.
   if (GREETING_WORDS.some((w) => q === w || q.startsWith(w + " ") || q.startsWith(w + "!"))) {
      return { text: "Hey! I can help you find plots, villas, apartments or commercial land across the Future City corridor — tell me a location, a budget, or what you're looking for." };
   }

   // 0b. Thanks / closing.
   if (includesAny(q, THANKS_WORDS)) {
      return { text: "Happy to help! If you want a human touch too, our team is a message away on the Contact page." };
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

   // 2b. "Plots vs villas — which is better?" — a type-level comparison, not a
   // location comparison, so it needs its own honest, non-fabricated answer.
   if (includesAny(q, COMPARE_TYPE_WORDS)) {
      return {
         text: "It depends on your goal. Plots suit buyers focused on long-horizon land appreciation and flexibility to build later, with generally lower entry cost. Villas suit buyers who want a ready or near-ready home and are willing to pay more upfront for construction and amenities. Tell me your budget and I can show what's currently available in each.",
      };
   }

   // 2c. "What is Future City corridor?" — explainer, not a listing search.
   if (includesAny(q, CORRIDOR_WORDS)) {
      return {
         text: "The Future City corridor is the southern growth belt of Hyderabad anchored by the upcoming Future City master-planned zone, stretching through nodes like Mucherla, Adibatla and Maheshwaram along NH-44. It's where most of the plotted-land and industrial-land activity on this platform is concentrated. Ask me about a specific node and I'll tell you more.",
      };
   }

   // 2d. Site visit process.
   if (includesAny(q, VISIT_WORDS)) {
      return {
         text: "Open any listing and use the \"Request Site Visit\" option on the property page — our team will confirm a slot and share the contact once approved. Want me to pull up a specific property or location first?",
      };
   }

   // 2e. Home loan / financing.
   if (includesAny(q, LOAN_WORDS)) {
      return {
         text: "Financing availability depends on the property type and lender — villas and apartments are generally easier to get a home loan against, while plot/land loans are a separate (and sometimes more limited) category with most banks. Worth confirming with your bank for the specific property before you commit.",
      };
   }

   // 3. Proximity to upcoming infrastructure (NH-44, ORR, airport, Future City).
   if (q.includes("infrastructure") || q.includes("closest") || q.includes("nearest")) {
      return {
         text: `Future City itself is the anchor node of the corridor. ${cap("mucherla")} sits immediately next to it on the NH-44 / Bangalore Highway belt, while ${cap("adibatla")} is the industrial node further along NH-44 and ${cap("shamshabad")} is closest to Rajiv Gandhi International Airport. These are generally the areas closest to confirmed infrastructure right now.`,
         properties: filterByLocation("future city").concat(filterByLocation("mucherla")).concat(filterByLocation("adibatla")).filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i),
      };
   }

   // 4. Combined-signal search — the core "understands keywords, not just one
   // exact phrase" behaviour. Collects every signal present in the question
   // (location, type, budget, verified-only, investment-suited, cheapest)
   // and applies them together, then reflects back what it understood so the
   // person can see it's reading the whole sentence, not pattern-matching.
   const loc = findLocation(q);
   const type = findType(q);
   const budget = parseBudget(q);
   const wantsVerified = includesAny(q, VERIFIED_WORDS);
   const wantsInvestment = includesAny(q, INVESTMENT_WORDS);
   const wantsCheapest = includesAny(q, CHEAP_WORDS);
   const wantsGeneric = q.includes("show me") || q.includes("plots") || q.includes("properties") || q.includes("available") || q.includes("looking for");

   if (loc || type || budget !== null || wantsVerified || wantsInvestment || wantsCheapest || wantsGeneric) {
      let pool = AI_DATASET;
      const understood: string[] = [];

      if (loc) { pool = filterByLocation(loc, pool); understood.push(cap(loc)); }
      if (type) { pool = filterByType(type, pool); understood.push(type); }
      if (budget !== null) { pool = filterByBudget(budget, pool); understood.push(`under ${formatINR(budget)}`); }
      if (wantsVerified) { pool = pool.filter((p) => p.verification_status === "Verified"); understood.push("verified only"); }
      if (wantsInvestment) {
         pool = pool.filter((p) => (p.suitable_for ?? "").toLowerCase().includes("investor"));
         pool = [...pool].sort((a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0));
         understood.push("investor-suited");
      }
      if (wantsCheapest && pool.length > 0) {
         pool = [...pool].sort((a, b) => a.price - b.price).slice(0, 1);
         understood.push("lowest price first");
      }

      if (pool.length === 0) {
         const what = understood.length > 0 ? understood.join(", ") : "that";
         return { text: `I couldn't find a matching property in the current listings for ${what}. Try widening the budget or location.` };
      }

      const prefix = understood.length > 0 ? `Looking for ${understood.join(", ")} — ` : "";
      return {
         text: `${prefix}I found ${pool.length} matching opportunit${pool.length === 1 ? "y" : "ies"}.`,
         properties: pool,
      };
   }

   // 5. Price range for a location, with no other filters detected above.
   if (q.includes("price range") || q.includes("price")) {
      const pool = AI_DATASET;
      const prices = pool.map((p) => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return { text: `Current listed opportunities range from ${formatINR(min)} to ${formatINR(max)}.`, properties: pool };
   }

   // 6. Fallback — nudge toward what the assistant can actually do.
   return {
      text: "I can help with locations (Future City, Mucherla, Shamshabad, Kollur, Maheshwaram, Adibatla, Shankarpally), budget, property type, verified listings, site visits or financing. Try something like \"verified plots under ₹1 crore in Mucherla\".",
   };
};

const cap = (s: string): string => s.replace(/\b\w/g, (c) => c.toUpperCase());