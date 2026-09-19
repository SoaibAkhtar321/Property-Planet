// src/lib/leads/assistanceOptions.ts
//
// Phase 4: the requirement-type categories offered on the Visitor
// Assistance form. Deliberately identical to leads.requirement_type
// (visitor_requirement_type enum, 0031_visitor_assistance_leads.sql) and
// to the site's existing property categories — do not add categories the
// database enum does not also have, and vice versa.

export type VisitorRequirementType = "plot_land" | "villa" | "apartment" | "commercial" | "other";

export const VISITOR_REQUIREMENT_TYPES: VisitorRequirementType[] = [
   "plot_land",
   "villa",
   "apartment",
   "commercial",
   "other",
];

export const VISITOR_REQUIREMENT_TYPE_LABELS: Record<VisitorRequirementType, string> = {
   plot_land: "Plot / Land",
   villa: "Villa",
   apartment: "Apartment",
   commercial: "Commercial",
   other: "Other",
};

export function isVisitorRequirementType(value: unknown): value is VisitorRequirementType {
   return typeof value === "string" && (VISITOR_REQUIREMENT_TYPES as string[]).includes(value);
}
