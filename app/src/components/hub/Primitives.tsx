/**
 * ELI5: The small reusable Lego bricks every hub page uses (dialog, avatar, badge, empty state, headings, cards).
 * What: HubDialog, Avatar, Badge, EmptyState, PageHeading, TransactionCard, TaskRow.
 * Owns: shared hub presentational primitives.
 * Depends on: components/ui/dialog, lib/constants, lib/dates, lib/types, lucide-react.
 */
import type { ReactNode } from "react";
import { ArrowUpRight, CalendarDays, Check, CircleAlert, House } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FALLBACK_HOME_IMAGE, MILESTONE_COUNT, PIPELINE_STAGES } from "@/lib/constants";
import { formatDate, todayInDenver } from "@/lib/dates";
import type { BadgeColor, Task, Transaction } from "@/lib/types";

interface HubDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}

/** Modal used by every hub form/detail popup (original `pn`). */
/** On phones every dialog is a full-screen sheet pinned to 0,0: cancel the desktop centring (top/left 50% + translate) in the component itself, so no CSS-order quirk can push a sheet off-screen. */
const PHONE_SHEET_CLASSES =
  "max-[760px]:top-0 max-[760px]:left-0 max-[760px]:translate-x-0 max-[760px]:translate-y-0 max-[760px]:max-w-none max-[760px]:rounded-none";

export function HubDialog({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: HubDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className={`hub-dialog ${wide ? "dialog-wide" : ""} ${PHONE_SHEET_CLASSES}`}>
        <DialogTitle className="dialog-title">{title}</DialogTitle>
        <DialogDescription className={description ? "dialog-description" : "sr-only"}>
          {description || title}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Initials circle for a person/team name (original `hn`). */
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const initials = name
    .split(/[ &]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return (
    <span
      className={`avatar ${small ? "avatar-small" : ""} ${name.includes("Gabriella") ? "avatar-sage" : name.includes("Client") ? "avatar-gold" : ""}`}
      title={name}
    >
      {initials}
    </span>
  );
}

/** Colored pill (original `rt`). */
export function Badge({
  children,
  color = "sage",
}: {
  children: ReactNode;
  color?: BadgeColor;
}) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

/** Friendly "nothing here" block (original `ts`). */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <House size={27} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

/** Page title block with optional eyebrow, description and right-side action (original `Fn`). */
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Pipeline/board card for one transaction (original `Fb`). */
export function TransactionCard({
  transaction,
  tasks,
  onOpen,
}: {
  transaction: Transaction;
  tasks: Task[];
  onOpen: () => void;
}) {
  const openTasks = tasks.filter((task) => !task.complete && task.transactionId === transaction.id);
  const atRisk = openTasks.some((task) => task.critical && task.due <= todayInDenver());
  const progressPercent = (transaction.completedMilestones.length / MILESTONE_COUNT) * 100;
  const nextTask = openTasks.sort((a, b) => a.due.localeCompare(b.due))[0];
  const stage = PIPELINE_STAGES.find((item) => item.id === transaction.stage);
  return (
    <button
      className={`transaction-card ${atRisk ? "card-risk" : ""}`}
      onClick={onOpen}
      aria-label={`Open ${transaction.address}`}
    >
      <div className="card-photo">
        <img
          src={transaction.image || FALLBACK_HOME_IMAGE}
          alt="Illustrative Southwestern home"
          loading="lazy"
        />
        <span className={`type-pill ${transaction.clientType === "Seller" ? "seller" : ""}`}>
          {transaction.clientType}
        </span>
        <span className="photo-action">
          <ArrowUpRight size={14} />
        </span>
      </div>
      <div className="card-body">
        <div className="card-address">{transaction.address}</div>
        <div className="card-location">{transaction.city}</div>
        <div className="mobile-card-stage">
          <Badge color={stage?.color}>
            {stage?.label} · {transaction.clientType}
          </Badge>
        </div>
        <div className="card-client">
          <span className="client-dot" />
          {transaction.client}
        </div>
        <div className="card-financial">
          <strong>${transaction.price.toLocaleString()}</strong>
          {atRisk ? (
            <Badge color="danger">
              <CircleAlert size={10} />
              At risk
            </Badge>
          ) : (
            <Badge color="sage">On track</Badge>
          )}
        </div>
        <div className="progress-track">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <div className={`card-next ${atRisk ? "text-danger" : ""}`}>
          {nextTask ? (
            <>
              <CalendarDays size={12} />
              <span>{nextTask.title}</span>
              <span className="card-next-date">{formatDate(nextTask.due)}</span>
            </>
          ) : (
            <>
              <Check size={12} />
              <span>Everything is up to date</span>
            </>
          )}
        </div>
        <div className="card-footer">
          <span>
            <CalendarDays size={12} />
            Closes {formatDate(transaction.terms.settlement ?? null)}
          </span>
          <Avatar name={transaction.owner} small />
        </div>
      </div>
    </button>
  );
}

/** One checkable task line (original `kh`). */
export function TaskRow({
  task,
  address,
  onToggle,
  onOpen,
}: {
  task: Task;
  address: string;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const today = todayInDenver();
  const dueLabel = task.due < today ? "Overdue" : task.due === today ? "Today" : formatDate(task.due);
  return (
    <div className={`task-row ${task.complete ? "task-complete" : ""}`}>
      <button
        className={`check-button ${task.complete ? "checked" : ""}`}
        aria-label={`${task.complete ? "Reopen" : "Complete"} ${task.title}`}
        onClick={onToggle}
      >
        {task.complete && <Check size={12} />}
      </button>
      <button className="task-copy" onClick={onOpen}>
        <strong>{task.title}</strong>
        <span>{address}</span>
        <small className={task.critical && !task.complete ? "text-danger" : ""}>
          {task.critical && !task.complete && <span className="tiny-dot" />}
          {dueLabel} <span className="task-dot">·</span> {task.owner}
        </small>
      </button>
    </div>
  );
}
