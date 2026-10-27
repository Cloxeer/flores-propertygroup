/**
 * ELI5: The words and labels the client's journey page uses.
 * What: Tab ids, hidden milestones, and friendly step titles/descriptions for the client view.
 * Owns: Client-journey constants only (no JSX, no state).
 * Depends on: nothing.
 */

export type ClientTab = "journey" | "documents" | "conversation";

export const DEFAULT_CLIENT_TAB: ClientTab = "journey";
export const CLIENT_PREVIEW_PATH = "/client-preview";
export const CLIENT_LOGO_SRC = "./flores-logo.png";
export const CLIENT_MESSAGE_MAX_LENGTH = 2000;
export const CLIENT_OFFLINE_FALLBACK_SCOPE = "client";
export const CLIENT_OFFLINE_DEMO_SCOPE = "demo";
export const CLIENT_PORTAL_SCOPE_PREFIX = "client-";
export const CLIENT_PORTAL_TOKEN_SCOPE_LENGTH = 12;
export const PIN_LENGTH = 4;

/** Milestones the client never sees on their roadmap. */
export const HIDDEN_CLIENT_MILESTONES: string[] = ["documents", "repairs"];

export const CLIENT_OFFLINE_CONFIRM =
  "Save key dates and published PDFs on this device for 24 hours? Other people using this device may access them. Only continue on a trusted device.";

export const SEASONAL_CARE_ITEMS: string[] = [
  "Check heating filters and replace as needed",
  "Inspect weatherstripping around doors and windows",
  "Test smoke and carbon monoxide alarms",
  "Review outdoor hoses and irrigation before freezing weather",
];

export const INSPECTION_CATEGORY = "Home inspections";
export const HOME_VENDOR_PREVIEW_COUNT = 3;

export const JOURNEY_STEP_TITLES: Record<string, string> = {
  earnest: "Make it official",
  inspection: "Get to know your home",
  resolution: "Work through the details",
  title: "Bring the pieces together",
  walkthrough: "One last look",
  settlement: "The keys to your next chapter",
};

export const JOURNEY_STEP_DESCRIPTIONS: Record<string, string> = {
  earnest:
    "Your earnest money helps secure your agreement. Your team will confirm safe payment instructions.",
  inspection:
    "Learn about the home with a professional inspection and your team’s guidance.",
  resolution:
    "If anything needs attention, we’ll help you understand the options and the next step.",
  title:
    "Your lender and title team are working on the details behind the scenes.",
  walkthrough:
    "Together, check your home before signing. Your team will confirm a time within the agreed window.",
  settlement:
    "Review, sign, and get ready. Funding and possession follow the terms of your agreement.",
};
