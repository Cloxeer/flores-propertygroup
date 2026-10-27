/**
 * ELI5: The "nothing here" page with a button back to the start.
 * What: Not-found route fallback in the app's own look; marks the page noindex.
 * Owns: 404 screen.
 * Depends on: wouter, lucide icons, styles/landing.css.
 */
import { useEffect } from "react";
import { House } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const robotsMeta = document.createElement("meta");
    robotsMeta.name = "robots";
    robotsMeta.content = "noindex";
    document.head.appendChild(robotsMeta);
    return () => robotsMeta.remove();
  }, []);

  return (
    <main className="landing not-found">
      <section className="landing-hero">
        <span className="landing-pill">404</span>
        <h1>This page isn’t here.</h1>
        <p>The link may be old, or the page may have moved. The start page has everything.</p>
        <div className="landing-actions">
          <button className="button primary" onClick={() => navigate("~/")}>
            <House size={16} />
            Back to the start
          </button>
        </div>
      </section>
    </main>
  );
}
