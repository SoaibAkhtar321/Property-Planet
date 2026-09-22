// Shared price-unit vocabulary for Individual Properties (0033_property_price_unit.sql).
//
// One source of truth for: the dropdown options (Overview.tsx, admin quick-edit
// form), the DB check constraint's allowed values (must stay in sync with the
// migration), and the display suffix used across every price-display surface.
//
// `null` / `undefined` means "no unit selected" -- today's behavior, and the
// only state any pre-existing listing can be in. Nothing here converts or
// infers a unit for a listing that doesn't have one.

export type PriceUnit = "sqft" | "sqyd" | "sqm" | "acre" | "total" | "custom";

export const PRICE_UNIT_OPTIONS: { value: PriceUnit; text: string }[] = [
   { value: "sqft", text: "₹ / sq. ft." },
   { value: "sqyd", text: "₹ / sq. yd." },
   { value: "sqm", text: "₹ / sq. m." },
   { value: "acre", text: "₹ / acre" },
   { value: "total", text: "Total Property Price" },
   { value: "custom", text: "Custom" },
];

const PRICE_UNIT_SUFFIX: Record<Exclude<PriceUnit, "custom">, string> = {
   sqft: "/ sq. ft.",
   sqyd: "/ sq. yd.",
   sqm: "/ sq. m.",
   acre: "/ acre",
   total: "", // total price already reads correctly with no suffix
};

/**
 * Suffix to append after a formatted price, e.g. "₹2,500" + " / sq. ft.".
 * Returns "" for unset/total (unchanged from today's plain price display),
 * and the seller/admin-entered custom label when price_unit is "custom".
 */
export function priceUnitSuffix(unit?: string | null, customLabel?: string | null): string {
   if (!unit) return "";
   if (unit === "custom") return customLabel ? `/ ${customLabel}` : "";
   if (unit in PRICE_UNIT_SUFFIX) return PRICE_UNIT_SUFFIX[unit as Exclude<PriceUnit, "custom">];
   return "";
}

const VALID_PRICE_UNITS: readonly string[] = PRICE_UNIT_OPTIONS.map((o) => o.value);

/**
 * Parses+validates price_unit/price_unit_label out of a submitted FormData,
 * mirroring the 0033 migration's check constraint so a bad value is
 * rejected in the server action rather than only at the DB layer. Shared by
 * both the seller and admin property actions so the rule can't drift
 * between the two.
 */
export function parsePriceUnitFields(
   formData: FormData
): { ok: true; price_unit: string | null; price_unit_label: string | null } | { ok: false; error: string } {
   const raw = formData.get("price_unit");
   const unit = typeof raw === "string" && raw.trim() ? raw.trim() : null;

   if (unit === null) {
      // No unit submitted -- valid, means "unlabeled/total", same as an
      // untouched pre-migration row.
      return { ok: true, price_unit: null, price_unit_label: null };
   }
   if (!VALID_PRICE_UNITS.includes(unit)) {
      return { ok: false, error: "Invalid price unit." };
   }

   const rawLabel = formData.get("price_unit_label");
   const label = typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim() : null;

   if (unit === "custom" && !label) {
      return { ok: false, error: "A custom price unit needs a label." };
   }

   return { ok: true, price_unit: unit, price_unit_label: unit === "custom" ? label : null };
}
