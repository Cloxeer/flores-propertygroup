/**
 * ELI5: A pop-up box that floats over the page, with IME-safe Escape handling.
 * What: shadcn Dialog wrappers around Radix; Escape is ignored while an IME composition is active.
 * Owns: Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription.
 * Depends on: @radix-ui/react-dialog, lucide-react, lib/utils.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ComponentProps,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPOSITION_END_GRACE_MS = 150;

interface DialogCompositionValue {
  isComposing: () => boolean;
  setComposing: (composing: boolean) => void;
  justEndedComposing: () => boolean;
  markCompositionEnd: () => void;
}

const DialogCompositionContext = createContext<DialogCompositionValue>({
  isComposing: () => false,
  setComposing: () => {},
  justEndedComposing: () => false,
  markCompositionEnd: () => {},
});

function useDialogComposition(): DialogCompositionValue {
  return useContext(DialogCompositionContext);
}

function Dialog({ ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  const composing = useRef(false);
  const justEnded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const value = useMemo<DialogCompositionValue>(
    () => ({
      isComposing: () => composing.current,
      setComposing: (next) => {
        composing.current = next;
      },
      justEndedComposing: () => justEnded.current,
      markCompositionEnd: () => {
        justEnded.current = true;
        if (timer.current) {
          clearTimeout(timer.current);
        }
        timer.current = setTimeout(() => {
          justEnded.current = false;
        }, COMPOSITION_END_GRACE_MS);
      },
    }),
    [],
  );
  return (
    <DialogCompositionContext.Provider value={value}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </DialogCompositionContext.Provider>
  );
}

function DialogPortal({ ...props }: ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}
DialogOverlay.displayName = "DialogOverlay";

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onEscapeKeyDown,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  const { isComposing } = useDialogComposition();
  const handleEscapeKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.isComposing || isComposing()) {
        event.preventDefault();
        return;
      }
      onEscapeKeyDown?.(event);
    },
    [isComposing, onEscapeKeyDown],
  );
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        onEscapeKeyDown={handleEscapeKeyDown}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <X />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export { Dialog, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle };
