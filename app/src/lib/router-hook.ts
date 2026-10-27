/**
 * ELI5: Picks how the app remembers "which page am I on" depending on where it is shown.
 * What: In-memory location inside Halite's srcdoc / static-preview iframe; URL-hash location everywhere else, so
 *       the published app works from any web address or folder with no server rewrite rules.
 * Owns: preview detection, the hash location + search hooks, and the router hook / search hook pair.
 * Depends on: wouter (memoryLocation, types), React useSyncExternalStore.
 */
import { useSyncExternalStore } from "react";
import { memoryLocation } from "wouter/memory-location";
import type { BaseLocationHook, Path } from "wouter";

const PREVIEW_PROTOCOL = "about:";
const PREVIEW_BASE_URI_MARKER = "/api/";
const MEMORY_START_PATH = "/";
const HASH_EVENT = "hashchange";

export function isPreviewEmbed(): boolean {
  return (
    window.location.protocol === PREVIEW_PROTOCOL ||
    document.baseURI.includes(PREVIEW_BASE_URI_MARKER)
  );
}

export interface RouterHooks {
  hook: BaseLocationHook;
  searchHook: (options?: { ssrSearch?: string }) => Path;
}

function subscribeToHash(onChange: () => void): () => void {
  window.addEventListener(HASH_EVENT, onChange);
  return () => window.removeEventListener(HASH_EVENT, onChange);
}

function readHash(): string {
  return window.location.hash.replace(/^#/, "") || "/";
}

function readHashPath(): string {
  return readHash().split("?")[0] || "/";
}

function readHashSearch(): string {
  const raw = readHash();
  const queryStart = raw.indexOf("?");
  return queryStart === -1 ? "" : raw.slice(queryStart + 1);
}

function navigateHash(to: Path, options?: { replace?: boolean }): void {
  if (options?.replace) {
    window.location.replace("#" + to);
  } else {
    window.location.hash = to;
  }
}

const useHashLocation: BaseLocationHook = () => [
  useSyncExternalStore(subscribeToHash, readHashPath),
  navigateHash,
];

function useHashSearch(): string {
  return useSyncExternalStore(subscribeToHash, readHashSearch);
}

function createRouterHooks(): RouterHooks {
  if (isPreviewEmbed()) {
    const memory = memoryLocation({ path: MEMORY_START_PATH });
    return { hook: memory.hook, searchHook: memory.searchHook };
  }
  return { hook: useHashLocation, searchHook: useHashSearch };
}

export const routerHooks: RouterHooks = createRouterHooks();
