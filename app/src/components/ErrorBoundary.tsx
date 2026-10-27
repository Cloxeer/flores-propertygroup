/**
 * ELI5: A safety net that shows a calm, plain-English screen instead of a wall of code if something breaks.
 * What: React class error boundary. A stale-version file error reloads once on its own; anything else shows a
 *       friendly message, a Reload button, and the technical detail tucked behind "Show details".
 * Owns: top-level render-error fallback UI.
 * Depends on: lib/lazy-page, lucide-react, styles/landing.css.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { isChunkLoadError, reloadOnceForNewVersion } from "@/lib/lazy-page";

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
    if (isChunkLoadError(error)) {
      reloadOnceForNewVersion();
    }
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    const staleVersion = isChunkLoadError(this.state.error);
    return (
      <main className="landing error-screen">
        <section className="landing-hero">
          <span className="landing-pill">{staleVersion ? "Update ready" : "Something went wrong"}</span>
          <h1>{staleVersion ? "There’s a newer version." : "That didn’t load."}</h1>
          <p>
            {staleVersion
              ? "Reload to pick it up. Anything you saved on this device is still here."
              : "Reload and you’ll be right back. Anything you saved on this device is safe."}
          </p>
          <div className="landing-actions">
            <button className="button primary" onClick={() => window.location.reload()}>
              <RotateCcw size={16} />
              Reload
            </button>
          </div>
          <details className="error-details">
            <summary>Show details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
