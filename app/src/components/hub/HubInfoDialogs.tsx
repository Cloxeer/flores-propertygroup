/**
 * ELI5: The two pop-ups from the top bar: the bell's task list and the question-mark help.
 * What: Notifications dialog (due-today tasks) and workspace help dialog.
 * Owns: copy and markup of those two dialogs.
 * Depends on: Primitives (HubDialog, EmptyState), types.
 */
import { ArrowRight, Bell, CalendarDays, House, LockKeyhole, MessageSquare } from "lucide-react";
import { EmptyState, HubDialog } from "@/components/hub/Primitives";
import type { Task, Transaction } from "@/lib/types";

export interface NotificationsDialogProps {
  open: boolean;
  onClose: () => void;
  dueTasks: Task[];
  transactions: Transaction[];
  onOpenTransaction: (transactionId: string) => void;
}

export function NotificationsDialog({
  open,
  onClose,
  dueTasks,
  transactions,
  onOpenTransaction,
}: NotificationsDialogProps) {
  return (
    <HubDialog
      open={open}
      onClose={onClose}
      title="A little heads-up."
      description="Important next steps and workspace updates."
    >
      {dueTasks.length > 0 && <span className="eyebrow">TIME-SENSITIVE TASKS</span>}
      {dueTasks.map((task) => (
        <button
          key={task.id}
          className="notification-item"
          onClick={() => {
            onClose();
            onOpenTransaction(task.transactionId);
          }}
        >
          <span className="metric-icon gold">
            <Bell size={16} />
          </span>
          <span>
            <strong>{task.title}</strong>
            <small>
              {transactions.find((transaction) => transaction.id === task.transactionId)?.address}{" "}
              · {task.owner}
            </small>
          </span>
          <ArrowRight size={14} />
        </button>
      ))}
      {!dueTasks.length && (
        <EmptyState
          title="Everything is a little quieter."
          description="No due-today tasks are waiting right now."
        />
      )}
      <p className="quiet-copy">
        In-app task feed only. No SMS, email or push delivery is connected.
      </p>
    </HubDialog>
  );
}

export interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  return (
    <HubDialog
      open={open}
      onClose={onClose}
      title="A clearer path, one step at a time."
      description="Your Flores workspace, in a few simple words."
    >
      <div className="help-list">
        <div>
          <House size={20} />
          <p>
            <strong>Every home journey lives in Transactions.</strong> Open a card to review contract
            dates, checklists and conversations.
          </p>
        </div>
        <div>
          <CalendarDays size={20} />
          <p>
            <strong>Dates come from the signed agreement.</strong> Enter negotiated fields, confirm
            delivery events and review calculated dates with your broker.
          </p>
        </div>
        <div>
          <LockKeyhole size={20} />
          <p>
            <strong>Demo is for exploring. Private is for your work.</strong>{" "}
            Sign in for your saved workspace. Invite clients with an expiring, four-digit-PIN link.
          </p>
        </div>
        <div>
          <MessageSquare size={20} />
          <p>
            <strong>Your drafts stay drafts.</strong> SMS, customer email and external integrations
            need production connections before delivery.
          </p>
        </div>
      </div>
      <button className="button primary" onClick={onClose}>
        Got it. Let’s keep moving.
        <ArrowRight size={15} />
      </button>
    </HubDialog>
  );
}
