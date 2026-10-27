/**
 * ELI5: The little pop-up messages ("Saved!") that appear in the corner.
 * What: sonner Toaster themed to the app's popover tokens (theme "system", as no next-themes provider existed).
 * Owns: Toaster wrapper.
 * Depends on: sonner.
 */
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
