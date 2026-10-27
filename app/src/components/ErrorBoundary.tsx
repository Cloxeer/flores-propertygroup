/**
 * ELI5: A safety net that shows a friendly error screen instead of a blank page.
 * What: React class error boundary rendering the error stack and a reload button.
 * Owns: top-level render-error fallback UI.
 * Depends on: lib/utils (cn), lucide-react.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-background">
        <div className="flex flex-col items-center w-full max-w-2xl p-8">
          <TriangleAlert size={48} className="text-destructive mb-6 flex-shrink-0" />
          <h2 className="text-xl mb-4">An unexpected error occurred.</h2>
          <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
            <pre className="text-sm text-muted-foreground whitespace-break-spaces">
              {this.state.error?.stack}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              "bg-primary text-primary-foreground",
              "hover:opacity-90 cursor-pointer",
            )}
          >
            <RotateCcw size={16} />
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
