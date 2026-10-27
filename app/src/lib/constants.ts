/**
 * ELI5: Fixed lists and labels the whole app agrees on.
 * What: Pipeline stages, empty state, storage keys, time zone and image paths.
 * Owns: shared named constants (no logic).
 * Depends on: types.ts.
 */
import type { HubState, PipelineStage } from "@/lib/types";

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "under-contract", label: "Under contract", color: "clay" },
  { id: "inspection", label: "Inspection", color: "gold" },
  { id: "financing", label: "Financing & title", color: "blue" },
  { id: "closing", label: "Ready to close", color: "sage" },
  { id: "closed", label: "Closed", color: "sage" },
];

export const EMPTY_HUB_STATE: HubState = {
  transactions: [],
  tasks: [],
  documents: [],
  messages: [],
  activity: [],
  drafts: [],
  preferences: {
    criticalSMS: true,
    inApp: true,
    phaseEmail: true,
    seasonalCare: true,
    taxReminder: true,
    exemptionReminder: true,
  },
};

export const HOME_IMAGES: string[] = [
  "./homes/home-mesa.webp",
  "./homes/home-sonoma.webp",
  "./homes/home-adobe_b79997ff.jpg",
];

/** Photo paths saved by earlier builds (heavy PNGs) → their light replacements. */
export const LEGACY_HOME_IMAGES: Record<string, string> = {
  "./homes/home-mesa_6e446655.png": "./homes/home-mesa.webp",
  "./homes/home-sonoma_eba79e72.png": "./homes/home-sonoma.webp",
};

export const FALLBACK_HOME_IMAGE = "./flores-logo.png";

export const DEMO_STORAGE_KEY = "flores-demo-v1";
export const PRIVATE_STORAGE_KEY = "flores-private-v1";
export const WORKSPACE_MODE_STORAGE_KEY = "flores-workspace-mode";
export const LAST_BACKUP_STORAGE_KEY = "flores-last-backup";
/** Days before the app gently asks for a fresh backup. */
export const BACKUP_REMINDER_DAYS = 7;
export const OFFLINE_SNAPSHOT_KEY = "flores-offline-snapshot";
export const OFFLINE_CACHE_NAME = "flores-shell-v1";
export const OFFLINE_CACHE_PREFIX = "flores-";
export const THEME_STORAGE_KEY = "theme";

export const OFFICE_TIME_ZONE = "America/Denver";
export const MOBILE_MEDIA_QUERY = "(max-width: 760px)";
/** Offline snapshots expire after 24h. */
export const OFFLINE_TTL_MS = 1440 * 60 * 1000;
/** Milestone count used for progress bars on transaction cards. */
export const MILESTONE_COUNT = 8;
