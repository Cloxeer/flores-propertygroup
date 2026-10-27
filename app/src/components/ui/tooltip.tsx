/**
 * ELI5: Lets hovering a thing show a tiny label (this app only uses the provider).
 * What: TooltipProvider wrapper with zero default delay.
 * Owns: TooltipProvider.
 * Depends on: @radix-ui/react-tooltip.
 */
import type { ComponentProps } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

export { TooltipProvider };
