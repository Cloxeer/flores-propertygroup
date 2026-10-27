/**
 * ELI5: What a brand-new account sees: three plain steps and one big button.
 * What: Empty-workspace welcome card replacing the dashboard when there are no transactions yet.
 * Owns: Welcome copy and the single primary action.
 * Depends on: lucide icons.
 */
import { Plus } from "lucide-react";

const WELCOME_STEPS = [
  "Add a home and the contract dates.",
  "We build the roadmap and reminders for you.",
  "Invite your client when you’re ready.",
];

export interface WelcomePanelProps {
  onNew: () => void;
}

export function WelcomePanel({ onNew }: WelcomePanelProps) {
  return (
    <section className="welcome-panel">
      <span className="tracker-eyebrow">Welcome</span>
      <h2>Let’s set up your first home journey.</h2>
      <ol>
        {WELCOME_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button className="button primary" onClick={onNew}>
        <Plus size={16} />
        Add your first home
      </button>
    </section>
  );
}
