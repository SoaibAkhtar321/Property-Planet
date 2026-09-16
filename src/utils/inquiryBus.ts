// src/utils/inquiryBus.ts
//
// Dependency-free pub/sub for the universal inquiry flow, following the
// exact pattern already used by propertyPlanetAIBus.ts — so a "Send
// Inquiry" button anywhere (property card, project card, property detail,
// project detail, project unit) can open the single globally-mounted
// InquiryDialog without prop-drilling or Redux, and without each surface
// growing its own enquiry form.
//
// This is transport only. It creates no lead system: the dialog it opens
// calls the existing createInquiry()/createProjectInquiry() server actions
// in src/lib/leads/actions.ts, which write to the existing `leads` table
// and therefore show up in the existing Admin -> Leads screen.
//
// PENDING CONTEXT (the "don't lose my enquiry at the Google redirect" bit):
// signing in with Google is a full-page navigation away to Google and back
// via /auth/callback. Nothing in React survives that. So before the
// redirect the dialog writes what the buyer had entered into
// sessionStorage, and on mount after the round trip it reads it back,
// reopens on the same property/project and finishes the submission.
//
// sessionStorage (not localStorage) is deliberate: the context is scoped
// to this tab and this browsing session, and is cleared the moment it is
// consumed. It holds only what the buyer typed plus the target id — no
// tokens, no role, no identity. Identity is re-derived server-side on
// submit, so a tampered payload can at most change which *published*
// property the enquiry is filed against under the tamperer's own account.

export type InquiryTargetKind = "property" | "project";

export interface InquiryTarget {
   kind: InquiryTargetKind;
   /** properties.id or projects.id — re-validated server-side against
    *  property_public / project_public before any lead is created. */
   id: string;
   /** Display-only, so the dialog and the success state can name what the
    *  buyer enquired about. Never trusted for anything else. */
   title: string;
   /** Display-only sub-label (locality, developer, etc.). */
   subtitle?: string;
}

export interface PendingInquiry {
   target: InquiryTarget;
   phone: string;
   message: string;
   preferredDate: string;
   preferredTime: string;
   /** Same-origin path to come back to after authentication. */
   returnTo: string;
   savedAt: number;
}

type Listener = (target: InquiryTarget) => void;

const listeners = new Set<Listener>();

export const openInquiry = (target: InquiryTarget): void => {
   listeners.forEach((listener) => listener(target));
};

export const onInquiryOpen = (listener: Listener): (() => void) => {
   listeners.add(listener);
   return () => listeners.delete(listener);
};

const PENDING_KEY = "pp:pending-inquiry";
/** A stashed enquiry older than this is stale; the buyer has moved on. */
const PENDING_TTL_MS = 20 * 60 * 1000;

export const savePendingInquiry = (pending: PendingInquiry): void => {
   try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
   } catch {
      // Private mode / storage disabled. The enquiry simply isn't restored
      // after sign-in; the buyer re-opens the form. Never fatal.
   }
};

/** Reads and immediately clears the stashed enquiry (single use). */
export const consumePendingInquiry = (): PendingInquiry | null => {
   try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as PendingInquiry;
      if (
         !parsed?.target?.id ||
         (parsed.target.kind !== "property" && parsed.target.kind !== "project") ||
         typeof parsed.savedAt !== "number" ||
         Date.now() - parsed.savedAt > PENDING_TTL_MS
      ) {
         return null;
      }
      return parsed;
   } catch {
      return null;
   }
};

export const clearPendingInquiry = (): void => {
   try {
      sessionStorage.removeItem(PENDING_KEY);
   } catch {
      /* no-op */
   }
};
