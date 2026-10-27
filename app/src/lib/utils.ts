/**
 * ELI5: A tiny helper that glues CSS class names together without conflicts.
 * What: shadcn `cn` (clsx + tailwind-merge) plus the UUID id generator used by the hub.
 * Owns: className merging and new-id creation.
 * Depends on: clsx, tailwind-merge.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** New unique id for transactions, tasks, messages, etc. (original `Ln`). */
export function newId(): string {
  return crypto.randomUUID();
}
