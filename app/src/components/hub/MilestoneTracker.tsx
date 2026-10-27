/**
 * ELI5: Shows where a deal is on its road to closing, and the one thing to do next.
 * What: Uber-style tracker — next-step hero card, 8-segment progress bar, closing countdown, and the full
 *       milestone list folded behind one disclosure.
 * Owns: Roadmap tab markup for the transaction detail dialog.
 * Depends on: ContractDeadline type, formatDate/daysUntil, todayInDenver, lucide icons.
 */
import { Check, ClipboardCheck, MessageSquare } from "lucide-react";
import { describeDaysFromToday, formatDate } from "@/lib/dates";
import type { ContractDeadline } from "@/lib/types";

export interface MilestoneTrackerProps {
  deadlines: ContractDeadline[];
  completedIds: string[];
  settlement: string | null | undefined;
  onToggle: (milestoneId: string) => void;
  onDiscuss: (milestoneId: string) => void;
}

export function MilestoneTracker({ deadlines, completedIds, settlement, onToggle, onDiscuss }: MilestoneTrackerProps) {
  const completedCount = deadlines.filter((deadline) => completedIds.includes(deadline.id)).length;
  const nextDeadline = deadlines.find((deadline) => !completedIds.includes(deadline.id));

  return (
    <div className="tracker">
      <section className="tracker-next" aria-label="Next step">
        {nextDeadline ? (
          <>
            <span className="tracker-eyebrow">Next step</span>
            <h3>{nextDeadline.label}</h3>
            <p>
              {nextDeadline.date
                ? `${formatDate(nextDeadline.date)} · ${describeDaysFromToday(nextDeadline.date)}`
                : "Needs a date before it can be tracked"}
            </p>
            <div className="tracker-actions">
              <button className="button primary" onClick={() => onToggle(nextDeadline.id)}>
                <Check size={16} />
                Mark complete
              </button>
              <button className="button secondary" onClick={() => onDiscuss(nextDeadline.id)}>
                <MessageSquare size={16} />
                Discuss
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="tracker-eyebrow">All done</span>
            <h3>Every milestone is complete.</h3>
            <p>This home journey is ready to celebrate.</p>
          </>
        )}
      </section>
      <div className="tracker-progress">
        <ol aria-label={`${completedCount} of ${deadlines.length} milestones complete`}>
          {deadlines.map((deadline) => {
            const isComplete = completedIds.includes(deadline.id);
            const isCurrent = nextDeadline?.id === deadline.id;
            return <li key={deadline.id} className={isComplete ? "done" : isCurrent ? "current" : ""} />;
          })}
        </ol>
        <p>
          <span>
            {completedCount} of {deadlines.length} complete
          </span>
          {settlement && (
            <span>
              Signing {formatDate(settlement)} · {describeDaysFromToday(settlement)}
            </span>
          )}
        </p>
      </div>
      <details className="milestone-all">
        <summary>See all {deadlines.length} milestones</summary>
        <div className="contract-review">
          <ClipboardCheck size={17} />
          <p>
            <strong>Contract-aware. Broker-reviewed.</strong>
            {
              " Confirm all selections, delivery events and amendments. Specific dates stay fixed; counted-day deadlines follow the contract’s rollover rules."
            }
          </p>
        </div>
        <div className="milestone-list">
          {deadlines.map((deadline) => {
            const isComplete = completedIds.includes(deadline.id);
            return (
              <div key={deadline.id} className={`milestone-item ${isComplete ? "is-complete" : ""}`}>
                <button
                  className={`milestone-check ${isComplete ? "checked" : ""}`}
                  onClick={() => onToggle(deadline.id)}
                  aria-label={`${isComplete ? "Reopen" : "Complete"} ${deadline.label}`}
                >
                  {isComplete ? <Check size={15} /> : <span />}
                </button>
                <div className="milestone-copy">
                  <h4>{deadline.label}</h4>
                  <span>{deadline.source}</span>
                  <p>{deadline.note}</p>
                </div>
                <div className="milestone-right">
                  <strong>{deadline.date ? formatDate(deadline.date) : "Needs input"}</strong>
                  <button onClick={() => onDiscuss(deadline.id)}>
                    <MessageSquare size={13} />
                    Discuss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
