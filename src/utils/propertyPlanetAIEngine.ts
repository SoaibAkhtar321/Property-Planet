// propertyPlanetAIEngine.ts
//
// Deterministic, rule-based response engine for the Property Planet AI
// assistant. It has NO built-in inventory: every property it can mention is
// passed in by the caller. The only caller is the server action in
// src/lib/ai/actions.ts, which loads the dataset from the public
// `property_public` view (published, sale, individual listings only), so the
// assistant can never surface a demo, unpublished, private or fabricated
// listing.
//
// What this engine deliberately does NOT do:
//   - invent properties, prices, availability, verification status, trust
//     scores or RERA/legal claims;
//   - make investment-return, appreciation or infrastructure claims — there is
//     no data source for them, so it says so;
//   - see seller/buyer contact details, leads or exact locations — the
//     dataset shape below simply has no field for them.
//
// Anything outside what it can answer is handed to the business's real,
// verified contact details (src/lib/site/contact.ts) instead of guessed at.
//
// No React/DOM dependency and no I/O: easy to unit-test, and the public
// surface (generateAIResponse) is the seam a real LLM/API could replace later
// without touching the widget.

import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from "@/lib/site/contact";

export interface PropertyPlanetProperty {
   id: string;
   title: string;
   slug: string;
   propertyType: string;
   price: number;
   /**
    * Already-formatted suffix from the shared priceUnit vocabulary/formatter
    * (priceUnitSuffix() in @/lib/properties/priceUnit), e.g. "/ sq. ft." or
    * "/ CustomLabel". Undefined for a listing with no price_unit set --
    * `price` alone is the total price, same as before this field existed.
    * Never invented here: this engine only carries through what the caller
    * (src/lib/ai/actions.ts) loaded from the actual stored row.
    */
   priceUnit?: string;
   city: string;
   locality: string;
   /** e.g. "200 sqyd" — only when the listing actually has both area and unit. */
   areaText?: string;
}

export interface PropertyPlanetAIContext {
   /** True only when an admin has actually uploaded the site RERA certificate. */
   hasReraCertificate?: boolean;
}

export interface PropertyPlanetAIResponse {
   text: string;
   properties?: PropertyPlanetProperty[];
}

// Localities specified by the client for the homepage locality section. Used
// only to RECOGNISE a place named in a question, so the assistant can say
// honestly that nothing is currently listed there. Nothing is said about
// them beyond what the live dataset contains.
const CLIENT_LOCALITIES = [
   "raviryala",
   "tukkuguda",
   "kongara kalan",
   "adibatla",
   "kongara khurd",
   "nadargul",
   "maheshwaram",
];

const MAX_CARDS = 6;

// Every "ask the team" hand-off uses this one string, built from the single
// source of truth for contact details.
const CONTACT_LINE = `Call us on ${CONTACT_PHONE_DISPLAY} or email ${CONTACT_EMAIL}.`;

// ---------------------------------------------------------------------------
// Filters (composable, deterministic)
// ---------------------------------------------------------------------------

export const filterByLocation = (query: string, data: PropertyPlanetProperty[]): PropertyPlanetProperty[] => {
   const q = query.toLowerCase();
   return data.filter(
      (p) => p.locality.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
   );
};

export const filterByType = (types: string[], data: PropertyPlanetProperty[]): PropertyPlanetProperty[] =>
   data.filter((p) => types.some((t) => p.propertyType.toLowerCase().includes(t)));

// maxAmount is a plain rupee value (already converted from lakh/crore).
export const filterByBudget = (maxAmount: number, data: PropertyPlanetProperty[]): PropertyPlanetProperty[] =>
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

const cap = (s: string): string => s.replace(/\b\w/g, (c) => c.toUpperCase());

// Returns the property_type substrings to match, plus a label for the reply.
const findType = (text: string): { match: string[]; label: string } | null => {
   const q = text.toLowerCase();
   if (q.includes("plot")) return { match: ["plot"], label: "Plot" };
   if (q.includes("land")) return { match: ["land", "plot"], label: "Land" };
   if (q.includes("villa")) return { match: ["villa"], label: "Villa" };
   if (q.includes("apartment") || q.includes("flat")) return { match: ["apartment", "flat"], label: "Apartment" };
   if (q.includes("commercial")) return { match: ["commercial"], label: "Commercial" };
   return null;
};

// ---------------------------------------------------------------------------
// Keyword understanding
// ---------------------------------------------------------------------------

const GREETING_WORDS = ["hi", "hello", "hey", "hii", "helo", "yo", "namaste"];
const THANKS_WORDS = ["thanks", "thank you", "thnx", "thx", "ty"];

const ABOUT_WORDS = ["who are you", "about property planet", "what is property planet", "what do you do", "what can you do", "about you", "your company", "about the company"];
const CONTACT_WORDS = ["contact", "phone", "call", "email", "e-mail", "mail", "whatsapp", "number", "address", "office", "agent", "human", "advisor", "talk to", "speak to", "reach you", "helpline", "customer care", "support"];
const RERA_WORDS = ["rera"];
const VERIFICATION_QUESTION_WORDS = ["verify", "verified", "verification", "genuine", "authentic", "trusted", "trust score", "is it legit", "legit", "legal check", "clear title", "title check", "legal", "documents", "document"];
const INVESTMENT_WORDS = ["invest", "investment", "returns", "appreciation", "roi", "resale"];
const INFRA_WORDS = ["infrastructure", "corridor", "future city", "orr", "airport", "highway"];
const CHEAP_WORDS = ["cheap", "affordable", "budget-friendly", "lowest price", "low budget"];
const LOAN_WORDS = ["loan", "emi", "finance", "financing", "mortgage", "bank loan"];
const VISIT_WORDS = ["site visit", "book a visit", "schedule a visit", "site tour", "visit the site", "book visit", "visit"];
const COMPARE_TYPE_WORDS = ["plots vs villas", "plot vs villa", "plot or villa", "villa or plot", "which is better"];
const SELL_WORDS = ["sell my", "sell property", "sell a property", "sell with", "become a seller", "be a seller", "list my", "list a property", "list property", "post my property", "post a property", "seller", "add listing", "add property"];
const RENT_WORDS = ["rent", "rental", "lease", "pg"];
const ENQUIRY_WORDS = ["enquiry", "inquiry", "enquire", "inquire", "interested", "i want to buy", "how to buy", "how do i buy", "buy a plot", "buy a property"];
const ACCOUNT_WORDS = ["login", "log in", "sign in", "sign up", "signup", "register", "create account", "account", "password"];
const FAVOURITE_WORDS = ["favourite", "favorite", "wishlist", "save property", "saved"];
const PROJECT_WORDS = ["project", "projects", "layout", "layouts", "gated", "developer"];
const LOCALITY_LIST_WORDS = ["which areas", "what areas", "which locations", "what locations", "areas do you", "locations do you", "where do you have", "localities", "which localities", "areas you cover"];
const MONEY_TERMS_WORDS = ["commission", "brokerage", "fee", "fees", "charges", "discount", "negotiate", "negotiation", "token", "advance", "booking amount", "payment", "registration cost", "stamp duty", "gst", "tax"];
const LOCATION_PRIVACY_WORDS = ["exact location", "exact address", "google map", "maps", "pin location", "where exactly"];
const PRIVACY_WORDS = ["privacy", "my data", "delete my account", "delete account", "terms"];

const includesAny = (q: string, words: string[]): boolean =>
   words.some((w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(q));

const showing = (n: number, total: number) => (total > n ? ` Showing the first ${n}.` : "");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const generateAIResponse = (
   question: string,
   dataset: PropertyPlanetProperty[],
   context: PropertyPlanetAIContext = {}
): PropertyPlanetAIResponse => {
   const q = question.toLowerCase().trim();

   // Locations the assistant can recognise: the client's localities plus every
   // locality that actually appears in the live dataset.
   const knownLocations = Array.from(
      new Set([...CLIENT_LOCALITIES, ...dataset.map((p) => p.locality.toLowerCase().trim()).filter(Boolean)])
   );
   const findLocation = (text: string): string | null => knownLocations.find((loc) => text.includes(loc)) ?? null;

   if (!q) {
      return { text: "Ask me about a location, a budget or a property type — for example \"plots in Adibatla under ₹1 crore\"." };
   }

   // 0a. Greeting.
   if (GREETING_WORDS.some((w) => q === w || q.startsWith(w + " ") || q.startsWith(w + "!"))) {
      return { text: "Hey! I can help you find plots, villas or apartments from Property Planet's published listings — tell me a location, a budget, or what you're looking for." };
   }

   // 0b. Thanks / closing.
   if (includesAny(q, THANKS_WORDS)) {
      return { text: `Happy to help! If you'd like to talk to our team directly: ${CONTACT_LINE}` };
   }

   // 1. About Property Planet.
   if (includesAny(q, ABOUT_WORDS)) {
      return {
         text: "Property Planet is a real estate platform for discovering plots, land, villas and apartments across Hyderabad's emerging growth areas. You can browse published listings and projects, send an enquiry, and request a site visit. I can search listings by location, budget and type — and our team handles everything else.",
      };
   }

   // 2. RERA — the certificate belongs to the COMPANY (registration to operate
   // as a real estate business), and is only mentioned as held when it has
   // actually been uploaded. It is never presented as a per-listing check.
   if (includesAny(q, RERA_WORDS)) {
      return {
         text: context.hasReraCertificate
            ? `Yes — Property Planet is RERA registered to operate as a real estate business, and the certificate is displayed on our homepage. That registration is for the company itself; it doesn't mean each individual listing has been independently verified, so please do your own due diligence on any property. For specific questions: ${CONTACT_LINE}`
            : `Our RERA registration details will be shown on the website once the certificate is published there. For any RERA question right now: ${CONTACT_LINE}`,
      };
   }

   // 3. Contact / talk to a person.
   if (includesAny(q, CONTACT_WORDS)) {
      return {
         text: `You can reach the Property Planet team directly — ${CONTACT_LINE} You can also use the Contact page on this website.`,
      };
   }

   // 4. "Tell me about this property" — no property context in a global widget.
   if (q.includes("this property") || (q.includes("tell me about") && !findLocation(q) && !findType(q))) {
      return {
         text: `Open a specific listing for its full details, or tell me a location, budget or property type and I'll surface matching listings here. For anything about a particular property: ${CONTACT_LINE}`,
      };
   }

   // 5. Verification / legal / documents — answer honestly instead of implying
   // a check that does not exist.
   if (includesAny(q, VERIFICATION_QUESTION_WORDS)) {
      return {
         text: `Property Planet doesn't independently verify ownership, title or legal compliance for individual listings — admin approval only means a listing met our posting guidelines, not a legal check. Please do your own due diligence or consult a professional before buying. For questions about documents for a specific property, our team can guide you: ${CONTACT_LINE}`,
      };
   }

   // 6. Money terms — fees, commission, discounts, payment: nothing here is
   // published, so hand off rather than guess.
   if (includesAny(q, MONEY_TERMS_WORDS)) {
      return {
         text: `Fees, charges, negotiation and payment terms depend on the specific property, and I don't have them. Please check with our team: ${CONTACT_LINE}`,
      };
   }

   // 7. Comparison between two locations — counts come from the live dataset only.
   if (q.includes("difference between") || q.includes(" vs ") || q.includes(" versus ")) {
      const mentioned = knownLocations.filter((loc) => q.includes(loc));
      if (mentioned.length >= 2) {
         const [a, b] = mentioned;
         const propsA = filterByLocation(a, dataset);
         const propsB = filterByLocation(b, dataset);
         const combined = [...propsA, ...propsB].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
         const text =
            `I don't have area guides for ${cap(a)} or ${cap(b)}, but here is what's currently published: ` +
            `${propsA.length} listing${propsA.length === 1 ? "" : "s"} in ${cap(a)} and ` +
            `${propsB.length} in ${cap(b)}.${showing(MAX_CARDS, combined.length)}`;
         return { text, properties: combined.slice(0, MAX_CARDS) };
      }
   }

   // 7b. Plot vs villa — a general, non-fabricated answer.
   if (includesAny(q, COMPARE_TYPE_WORDS)) {
      return {
         text: "It depends on your goal. Plots suit buyers who want flexibility to build later and generally a lower entry cost. Villas suit buyers who want a ready or near-ready home and are willing to pay more upfront for construction. Tell me your budget and I can show what's currently published in each.",
      };
   }

   // 8. Exact location — mirrors the real reveal rule.
   if (includesAny(q, LOCATION_PRIVACY_WORDS)) {
      return {
         text: "Listings show the general area. The exact location unlocks once your site visit for that property is confirmed by our team — send an enquiry and request a site visit from the listing page.",
      };
   }

   // 9. Site visit process — mirrors the real flow.
   if (includesAny(q, VISIT_WORDS)) {
      return {
         text: "Send an enquiry from the listing page, then use \"Request Site Visit\" on that page. Our team will confirm a slot, and the exact location unlocks once your visit is confirmed. You can cancel a requested or confirmed visit from your dashboard Messages. Want me to pull up a location or budget first?",
      };
   }

   // 10. How to enquire / buy.
   if (includesAny(q, ENQUIRY_WORDS)) {
      return {
         text: `Open the property you like and use the enquiry button — you can sign in while sending it, and our team will follow up. You can track your enquiries in your dashboard Messages. To speak to someone directly: ${CONTACT_LINE}`,
      };
   }

   // 11. Selling / listing.
   if (includesAny(q, SELL_WORDS)) {
      return {
         text: `To list a property, use "Become a Seller" in the menu and register as a seller. Listings are reviewed by our team before they are published. Questions about becoming a seller: ${CONTACT_LINE}`,
      };
   }

   // 12. Rentals — not offered.
   if (includesAny(q, RENT_WORDS)) {
      return {
         text: `Property Planet focuses on properties for sale — plots, land, villas and apartments — and doesn't list rentals. I can search sale listings by location, budget or type. For anything else: ${CONTACT_LINE}`,
      };
   }

   // 13. Account / login.
   if (includesAny(q, ACCOUNT_WORDS)) {
      return {
         text: `Use Login / Sign up in the menu to create an account or sign in — you'll need one to send an enquiry, request a site visit and track them from your dashboard. If you're stuck, use "Forgot password" on the login page, or: ${CONTACT_LINE}`,
      };
   }

   // 14. Favourites.
   if (includesAny(q, FAVOURITE_WORDS)) {
      return {
         text: "Sign in, then use the save/heart option on a listing. Your saved properties appear under Favourites in your dashboard.",
      };
   }

   // 15. Projects.
   if (includesAny(q, PROJECT_WORDS) && !findLocation(q)) {
      return {
         text: `Browse published projects on the Projects page in the menu. Each project page shows its details and lets you send an enquiry. For anything specific to a project: ${CONTACT_LINE}`,
      };
   }

   // 16. Which localities — recognised areas + what is actually listed.
   if (includesAny(q, LOCALITY_LIST_WORDS)) {
      const listed = Array.from(new Set(dataset.map((p) => p.locality).filter(Boolean)));
      const featured = CLIENT_LOCALITIES.map(cap).join(", ");
      return {
         text:
            `We feature localities including ${featured}. ` +
            (listed.length > 0
               ? `Right now, published listings are in: ${listed.slice(0, 12).join(", ")}.`
               : "There are no listings published right now.") +
            " Tell me a locality and I'll show what's available.",
      };
   }

   // 17. Home loan / financing — general, not property-specific.
   if (includesAny(q, LOAN_WORDS)) {
      return {
         text: "Financing depends on the property type and the lender — villas and apartments are generally easier to get a home loan against, while plot/land loans are a separate (and sometimes more limited) category with most banks. Worth confirming with your bank for the specific property before you commit.",
      };
   }

   // 18. Privacy / terms.
   if (includesAny(q, PRIVACY_WORDS)) {
      return {
         text: `You'll find our Privacy Policy and Terms of Service linked in the website footer. For privacy questions: ${CONTACT_LINE}`,
      };
   }

   // 19. Investment / infrastructure — no data source for returns,
   // appreciation or infrastructure timelines, so don't invent any.
   if (includesAny(q, INVESTMENT_WORDS) || includesAny(q, INFRA_WORDS)) {
      return {
         text: `I can't rate investment returns, appreciation or infrastructure timelines — I only have the listing details our team has published. I can filter listings by location, budget or type, and our team can talk you through an area: ${CONTACT_LINE}`,
      };
   }

   // 20. Combined-signal search over the live dataset.
   const loc = findLocation(q);
   const type = findType(q);
   const budget = parseBudget(q);
   const wantsCheapest = includesAny(q, CHEAP_WORDS);
   const wantsGeneric = q.includes("show me") || q.includes("plots") || q.includes("properties") || q.includes("available") || q.includes("looking for");

   if (loc || type || budget !== null || wantsCheapest || wantsGeneric) {
      if (dataset.length === 0) {
         return { text: `There are no listings published right now. Please check back soon, or ${CONTACT_LINE.charAt(0).toLowerCase()}${CONTACT_LINE.slice(1)}` };
      }

      let pool = dataset;
      const understood: string[] = [];

      if (loc) { pool = filterByLocation(loc, pool); understood.push(cap(loc)); }
      if (type) { pool = filterByType(type.match, pool); understood.push(type.label); }
      if (budget !== null) { pool = filterByBudget(budget, pool); understood.push(`under ${formatINR(budget)}`); }
      if (wantsCheapest && pool.length > 0) {
         pool = [...pool].sort((a, b) => a.price - b.price);
         understood.push("lowest price first");
      }

      if (pool.length === 0) {
         const what = understood.length > 0 ? understood.join(", ") : "that";
         return { text: `I couldn't find a published listing for ${what} right now. Try widening the budget or location — or ${CONTACT_LINE.charAt(0).toLowerCase()}${CONTACT_LINE.slice(1)}` };
      }

      const prefix = understood.length > 0 ? `Looking for ${understood.join(", ")} — ` : "";
      return {
         text: `${prefix}I found ${pool.length} published listing${pool.length === 1 ? "" : "s"}.${showing(MAX_CARDS, pool.length)}`,
         properties: pool.slice(0, MAX_CARDS),
      };
   }

   // 21. Price range across current listings.
   if (q.includes("price range") || q.includes("price")) {
      if (dataset.length === 0) {
         return { text: `There are no listings published right now. ${CONTACT_LINE}` };
      }
      const prices = dataset.map((p) => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return {
         text: `Currently published listings range from ${formatINR(min)} to ${formatINR(max)}.${showing(MAX_CARDS, dataset.length)}`,
         properties: dataset.slice(0, MAX_CARDS),
      };
   }

   // 22. Anything else is outside what this assistant can answer — hand off
   // to the real contact details rather than guess.
   return {
      text: `I can search published listings by location, budget or property type, and answer common questions about site visits, enquiries, selling and RERA. For anything else, our team will be happy to help — ${CONTACT_LINE}`,
   };
};
