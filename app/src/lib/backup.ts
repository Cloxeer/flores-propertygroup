/**
 * ELI5: Saves the whole private workspace to a file and reads it back, so nothing is lost if a phone is.
 * What: Versioned JSON backup (create + validate + restore) and last-backup bookkeeping.
 * Owns: Backup file format and its validation; the "days since last backup" clock.
 * Depends on: lib/types, lib/constants, lib/download.
 */
import { BACKUP_REMINDER_DAYS, LAST_BACKUP_STORAGE_KEY } from "@/lib/constants";
import { downloadTextFile } from "@/lib/download";
import type { HubState } from "@/lib/types";

const BACKUP_FORMAT = "flores-hub-backup";
const BACKUP_VERSION = 1;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LIST_KEYS = ["transactions", "tasks", "documents", "messages", "activity", "drafts"] as const;

interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  state: HubState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses a backup file's text. Throws an Error with a plain-English reason when it is not one of ours. */
export function parseBackupFile(text: string): HubState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not a Flores Hub backup.");
  }
  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT) {
    throw new Error("That file is not a Flores Hub backup.");
  }
  if (parsed.version !== BACKUP_VERSION) {
    throw new Error("That backup was made by a different version of the app.");
  }
  const state = parsed.state;
  if (!isRecord(state) || !isRecord(state.preferences)) {
    throw new Error("The backup is missing workspace data.");
  }
  for (const key of LIST_KEYS) {
    if (!Array.isArray(state[key])) {
      throw new Error("The backup is damaged: " + key + " is missing.");
    }
  }
  return state as unknown as HubState;
}

/** Downloads the workspace as a backup file and starts the "last backup" clock. */
export function downloadBackup(state: HubState): void {
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  const day = file.exportedAt.slice(0, 10);
  downloadTextFile("flores-hub-backup-" + day + ".json", JSON.stringify(file), "application/json");
  localStorage.setItem(LAST_BACKUP_STORAGE_KEY, file.exportedAt);
}

/** Whole days since the last backup, or null when none was ever made. */
export function daysSinceBackup(): number | null {
  const saved = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
  if (!saved) return null;
  return Math.floor((Date.now() - new Date(saved).getTime()) / MS_PER_DAY);
}

/** True when real data exists and the last backup is missing or older than the reminder window. */
export function backupIsDue(transactionCount: number): boolean {
  if (transactionCount === 0) return false;
  const days = daysSinceBackup();
  return days === null || days >= BACKUP_REMINDER_DAYS;
}

export function clearBackupClock(): void {
  localStorage.removeItem(LAST_BACKUP_STORAGE_KEY);
}
