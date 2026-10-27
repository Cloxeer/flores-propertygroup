/**
 * ELI5: When a new version goes live, an open tab can ask for a file that no longer exists; this reloads once so it picks up the new version.
 * What: lazyPage (React.lazy that recovers from stale-chunk failures), chunk-error detection and a reload-once-per-session guard.
 * Owns: stale-deploy recovery for lazily loaded screens.
 * Depends on: React, sessionStorage.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const RELOAD_FLAG = "flores-chunk-reload";
const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .* failed/i;

export function isChunkLoadError(error: unknown): boolean {
  return CHUNK_ERROR_PATTERN.test(error instanceof Error ? error.message : String(error));
}

/** Reloads the page once per browser tab session. Returns true when a reload was started. */
export function reloadOnceForNewVersion(): boolean {
  if (sessionStorage.getItem(RELOAD_FLAG)) {
    return false;
  }
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
  return true;
}

/** Called once the app has been running a while, so a later deploy may reload again. */
export function clearReloadGuard(): void {
  sessionStorage.removeItem(RELOAD_FLAG);
}

/** React.lazy that reloads once if the screen's file has moved (a new version was published). */
export function lazyPage<Props extends object>(
  load: () => Promise<{ default: ComponentType<Props> }>,
): LazyExoticComponent<ComponentType<Props>> {
  return lazy(() =>
    load().catch((error: unknown) => {
      if (isChunkLoadError(error) && reloadOnceForNewVersion()) {
        return new Promise<never>(() => undefined);
      }
      throw error;
    }),
  );
}
