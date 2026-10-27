/**
 * ELI5: The front door Anela sees first: what this is, two big choices, and how her data is treated.
 * What: Mobile-first landing page — logo, one-line promise, "Take the tour" (sample data) and "Start my private
 *       workspace" (empty, on-device), three value points, a plain data note and add-to-home-screen help.
 * Owns: Landing copy and layout; entering the hub in demo or private mode.
 * Depends on: HubContext (setDemo), wouter navigation, lucide icons, styles/landing.css.
 */
import { useLocation } from "wouter";
import { ArrowRight, CalendarCheck, HardDrive, ListChecks, MessageCircle } from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { FALLBACK_HOME_IMAGE } from "@/lib/constants";

const VALUE_POINTS = [
  { icon: ListChecks, title: "See what needs you today", body: "One short list instead of a pile of tabs." },
  { icon: CalendarCheck, title: "Every deadline, from the contract", body: "Dates build themselves from the agreement." },
  { icon: MessageCircle, title: "Clients always know the next step", body: "A calm view for them, a full view for your team." },
];

const HUB_PATH = "/app";

export default function Landing() {
  const { setDemo } = useHub();
  const [, navigate] = useLocation();

  function enter(demo: boolean) {
    setDemo(demo);
    navigate(HUB_PATH);
  }

  return (
    <main className="landing">
      <header className="landing-brand">
        <img src={FALLBACK_HOME_IMAGE} alt="" width={44} height={44} />
        <span>
          <strong>flores</strong>
          <small>PROPERTY GROUP</small>
        </span>
      </header>

      <section className="landing-hero">
        <span className="landing-pill">First look · Preview</span>
        <h1>Every home journey, in one calm place.</h1>
        <p>
          This is an early version of the app we’re building for you and your team. Tap around, try it with sample
          data, and tell us what feels right.
        </p>
        <div className="landing-actions">
          <button className="button primary" onClick={() => enter(true)}>
            Take the tour
            <ArrowRight size={16} />
          </button>
          <button className="button secondary" onClick={() => enter(false)}>
            Start my private workspace
          </button>
        </div>
        <p className="landing-hint">The tour uses made-up names. Your private workspace starts empty.</p>
      </section>

      <ul className="landing-values">
        {VALUE_POINTS.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <Icon size={22} aria-hidden="true" />
            <span>
              <strong>{title}</strong>
              {body}
            </span>
          </li>
        ))}
      </ul>

      <section className="landing-note">
        <HardDrive size={20} aria-hidden="true" />
        <p>
          <strong>Your data stays with you.</strong> Anything you add to your private workspace is saved only on this
          device. Nothing is sent anywhere. Download a backup from Settings whenever you like.
        </p>
      </section>

      <section className="landing-install">
        <h2>Keep it on your home screen</h2>
        <p>
          <strong>iPhone:</strong> tap Share, then “Add to Home Screen”. <strong>Android:</strong> open the browser menu,
          then “Install app”.
        </p>
      </section>

      <footer className="landing-footer">Early preview · Built with care by Halite Studio</footer>
    </main>
  );
}
