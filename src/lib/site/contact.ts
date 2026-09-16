// src/lib/site/contact.ts
//
// Single source of truth for Property Planet's real contact details, so a
// number or a social URL is never hardcoded in two places and can never
// drift. Everything here is a VERIFIED, supplied value.
//
// Deliberately absent: Facebook, X/Twitter, LinkedIn, YouTube and
// WhatsApp. No verified account/link exists for those, and inventing a
// destination for a real estate business — where a wrong link is a
// credibility and fraud problem, not a cosmetic one — is worse than
// showing no icon at all. Add an entry here only when a real account is
// confirmed; every consumer below renders whatever is present and skips
// whatever is not.

/** Business phone, digits only — safe to use directly in a tel: href. */
export const CONTACT_PHONE = "8096786351";

/** Human-readable form for display. */
export const CONTACT_PHONE_DISPLAY = "8096 786 351";

export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE}`;

export const CONTACT_EMAIL = "hello@propertyplanet.in";

/** Verified social accounts only. Keys map to Font Awesome brand icons. */
export const SOCIAL_LINKS: { name: string; icon: string; href: string }[] = [
   {
      name: "Instagram",
      icon: "instagram",
      href: "https://www.instagram.com/riality_of_hyderabad/",
   },
];
