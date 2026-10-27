/**
 * ELI5: The one box that tells Anela which deals need her right now, and what to do next.
 * What: Up to three at-risk deals, each with its next critical step and a single tap to open it.
 * Owns: Attention list markup, empty state and the "see all" link.
 * Depends on: Transaction/Task types, formatDate, lucide icons.
 */
import { ArrowRight, CircleCheck } from "lucide-react";
import type { Task, Transaction } from "@/lib/types";
import { formatDate } from "@/lib/dates";

const MAX_VISIBLE_ITEMS = 3;

export interface AttentionItem {
  transaction: Transaction;
  task: Task;
}

export interface AttentionPanelProps {
  items: AttentionItem[];
  /** Soonest next step per deal; shown as "Coming up" when nothing is urgent so every deal stays visible. */
  upcoming: AttentionItem[];
  onOpen: (transactionId: string) => void;
  onSeeAll: () => void;
}

export function AttentionPanel({ items, upcoming, onOpen, onSeeAll }: AttentionPanelProps) {
  const showUpcoming = items.length === 0 && upcoming.length > 0;
  const visibleItems = (showUpcoming ? upcoming : items).slice(0, MAX_VISIBLE_ITEMS);

  return (
    <section className="attention-panel" aria-labelledby="attention-heading">
      <header>
        <h2 id="attention-heading">{showUpcoming ? "Coming up" : "Needs you now"}</h2>
        {items.length > 0 && <span className="attention-count">{items.length}</span>}
      </header>
      {visibleItems.length === 0 ? (
        <p className="attention-clear">
          <CircleCheck size={20} />
          Nothing urgent. Every deal is on track.
        </p>
      ) : (
        <ul>
          {visibleItems.map(({ transaction, task }) => (
            <li key={transaction.id}>
              <button onClick={() => onOpen(transaction.id)}>
                <span className="attention-deal">
                  <strong>{transaction.address}</strong>
                  <span>{transaction.client}</span>
                </span>
                <span className="attention-step">
                  {task.title}
                  <small>Due {formatDate(task.due)}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > MAX_VISIBLE_ITEMS && (
        <button className="text-button" onClick={onSeeAll}>
          See all {items.length}
          <ArrowRight size={14} />
        </button>
      )}
    </section>
  );
}
