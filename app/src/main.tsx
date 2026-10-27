/**
 * ELI5: The front door: puts the app on the page.
 * What: React entry point; mounts <App/> into #root with global CSS.
 * Owns: bootstrapping and service-worker registration.
 * Depends on: App.tsx, index.css.
 */
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { isPreviewEmbed } from "./lib/router-hook";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}
createRoot(rootElement).render(<App />);

// Repeat visits paint from the shell cache. Skipped inside Halite's preview frames, where it would hide edits.
if ("serviceWorker" in navigator && import.meta.env.PROD && !isPreviewEmbed()) {
  navigator.serviceWorker.register("./sw.js").catch(() => undefined);
}
