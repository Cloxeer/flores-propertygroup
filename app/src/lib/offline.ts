/**
 * ELI5: Saves a read-only copy of the workspace so it can still be opened without internet.
 * What: Service-worker registration, shell cache and localStorage snapshot read/write/clear.
 * Owns: offline snapshot lifecycle (original i0 / l0 / MT / zT).
 * Depends on: constants.ts, types.ts.
 */
import {
  OFFLINE_CACHE_NAME,
  OFFLINE_CACHE_PREFIX,
  OFFLINE_SNAPSHOT_KEY,
  OFFLINE_TTL_MS,
} from "@/lib/constants";
import type { HubState, OfflineSnapshot } from "@/lib/types";

const SERVICE_WORKER_URL = "/sw.js";
const CACHEABLE_PATH_PREFIXES = ["/assets/", "/src/", "/node_modules/"];

/** Store a trimmed snapshot (finalized+published documents only) and cache the app shell. */
export async function saveOfflineSnapshot(state: HubState, scope: string): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Offline access is not supported by this browser.");
  }
  const snapshot: OfflineSnapshot = {
    state: {
      ...state,
      tasks: [],
      messages: [],
      activity: [],
      drafts: [],
      documents: state.documents.filter((doc) => doc.finalized && doc.published),
    },
    scope,
    expires: Date.now() + OFFLINE_TTL_MS,
  };
  await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  await navigator.serviceWorker.ready;
  const shellUrls = performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => {
      const url = new URL(name);
      return (
        url.origin === window.location.origin &&
        CACHEABLE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
      );
    });
  const cache = await caches.open(OFFLINE_CACHE_NAME);
  await Promise.all(shellUrls.map((url) => cache.add(url).catch(() => {})));
  localStorage.setItem(OFFLINE_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

/** Snapshot state for `scope`, or null if missing, other scope, or expired (removes expired). */
export function loadOfflineSnapshot(scope: string): HubState | null {
  try {
    const snapshot: OfflineSnapshot | null = JSON.parse(
      localStorage.getItem(OFFLINE_SNAPSHOT_KEY) || "null",
    );
    if (!snapshot || snapshot.scope !== scope || snapshot.expires < Date.now()) {
      if (snapshot && snapshot.expires < Date.now()) {
        localStorage.removeItem(OFFLINE_SNAPSHOT_KEY);
      }
      return null;
    }
    return snapshot.state;
  } catch {
    return null;
  }
}

/** Remove snapshot, flores-* caches and the service worker registration. */
export async function clearOfflineData(): Promise<void> {
  localStorage.removeItem(OFFLINE_SNAPSHOT_KEY);
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(OFFLINE_CACHE_PREFIX))
        .map((name) => caches.delete(name)),
    );
  }
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => registration.active?.scriptURL.endsWith(SERVICE_WORKER_URL))
        .map((registration) => registration.unregister()),
    );
  }
}

export function hasOfflineSnapshot(): boolean {
  return !!localStorage.getItem(OFFLINE_SNAPSHOT_KEY);
}
