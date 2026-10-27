/**
 * ELI5: Grey shimmering shapes that stand in for a page while it arrives, so the screen never looks empty.
 * What: Heading + three card placeholders matching the real page rhythm.
 * Owns: Loading placeholder markup (styles in styles/mobile.css).
 * Depends on: nothing.
 */
export function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Loading">
      <span className="sk sk-title" />
      <span className="sk sk-line" />
      <span className="sk sk-card" />
      <span className="sk sk-card" />
      <span className="sk sk-card" />
    </div>
  );
}
