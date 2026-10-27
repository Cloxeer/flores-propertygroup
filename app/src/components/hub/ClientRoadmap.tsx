/**
 * ELI5: The client's "My journey" tab — what to do next, how far along they are, and who to ask.
 * What: Brief, single next-step card, progress bar, roadmap (finished steps folded away), team and safety notes.
 * Owns: Active-transaction journey markup (no state).
 * Depends on: Primitives (Avatar, Badge), clientJourneyConstants, parent passes derived milestone data.
 */
import { ArrowRight, CalendarDays, Check, House, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { FALLBACK_HOME_IMAGE } from "@/lib/constants";
import { describeDaysFromToday, formatDate } from "@/lib/dates";
import type { ContractDeadline, Task, Transaction } from "@/lib/types";
import { Avatar, Badge } from "./Primitives";
import {
  JOURNEY_STEP_DESCRIPTIONS,
  JOURNEY_STEP_TITLES,
  type ClientTab,
} from "./clientJourneyConstants";

const MAX_HOMEWORK_TASKS = 3;

export interface ClientRoadmapProps {
  transaction: Transaction;
  milestones: ContractDeadline[];
  currentMilestone: ContractDeadline | undefined;
  completedCount: number;
  homeworkTasks: Task[];
  onChooseInspector: () => void;
  onNavigate: (tab: ClientTab) => void;
}

function stepDateText(milestone: ContractDeadline): string {
  if (milestone.date) return formatDate(milestone.date);
  if (milestone.id === "title") return "After your title documents arrive";
  if (milestone.id === "walkthrough") return "We’ll schedule a time before signing";
  return "Your team will confirm the date";
}

export function ClientRoadmap({
  transaction,
  milestones,
  currentMilestone,
  completedCount,
  homeworkTasks,
  onChooseInspector,
  onNavigate,
}: ClientRoadmapProps) {
  const settlement = transaction.terms.settlement;
  const isDone = (milestoneId: string) => transaction.completedMilestones.includes(milestoneId);
  const finishedSteps = milestones.filter((milestone) => isDone(milestone.id));
  const remainingSteps = milestones.filter((milestone) => !isDone(milestone.id));
  const needsInspector = transaction.clientType === "Buyer";

  function renderStep(milestone: ContractDeadline) {
    const done = isDone(milestone.id);
    const current = currentMilestone?.id === milestone.id;
    return (
      <div className={`client-step ${done ? "done" : ""} ${current ? "current" : ""}`} key={milestone.id}>
        <span className="step-number">{done ? <Check size={16} /> : milestones.indexOf(milestone) + 1}</span>
        <div>
          <div>
            <h3>{JOURNEY_STEP_TITLES[milestone.id] || milestone.label}</h3>
            {current && <Badge color="clay">You are here</Badge>}
          </div>
          <p>{JOURNEY_STEP_DESCRIPTIONS[milestone.id] || "Your team will help you with this next step."}</p>
          {milestone.id === "inspection" && transaction.inspectionStatus && (
            <Badge color="gold">{transaction.inspectionStatus}</Badge>
          )}
          <span className="step-date">
            <CalendarDays size={12} />
            {stepDateText(milestone)}
          </span>
        </div>
        {done && <span className="step-complete">Complete</span>}
      </div>
    );
  }

  return (
    <div className="client-stack">
      <section className="client-brief">
        <img src={transaction.image || FALLBACK_HOME_IMAGE} alt="Illustrative home exterior" loading="lazy" decoding="async" />
        <div>
          <span className="eyebrow">
            <Sparkles size={14} />
            YOUR HOME JOURNEY
          </span>
          <h1>Home is getting a little closer.</h1>
          <p>
            <House size={14} />
            <span>
              {transaction.address}
              {settlement && ` · Signing ${formatDate(settlement)} (${describeDaysFromToday(settlement)})`}
            </span>
          </p>
        </div>
      </section>

      <section className="client-next" aria-label="Your next step">
        <span className="eyebrow">YOUR NEXT STEP</span>
        <h2>
          {transaction.inspector
            ? "You’ve chosen your inspector."
            : needsInspector
              ? "Pick your home inspector."
              : JOURNEY_STEP_TITLES[currentMilestone?.id ?? ""] || currentMilestone?.label || "You’re all caught up."}
        </h2>
        <p>
          {transaction.inspector
            ? `${transaction.inspector} is selected. ${transaction.owner} will help coordinate scheduling.`
            : needsInspector
              ? "An inspection gives you a clearer picture of your home. Pick an inspector, and we’ll help with the rest."
              : JOURNEY_STEP_DESCRIPTIONS[currentMilestone?.id ?? ""] || "Your team will reach out with what comes next."}
        </p>
        {needsInspector && (
          <button className="button primary" onClick={onChooseInspector}>
            {transaction.inspector ? "Review inspector choice" : "Choose an inspector"}
            <ArrowRight size={16} />
          </button>
        )}
        {homeworkTasks.slice(0, MAX_HOMEWORK_TASKS).map((task) => (
          <div className="client-homework-task" key={task.id}>
            <span className="small-dot clay" />
            <span>
              {task.title}
              <small>{formatDate(task.due)}</small>
            </span>
          </div>
        ))}
      </section>

      <div className="tracker-progress">
        <ol aria-label={`${completedCount} of ${milestones.length} milestones complete`}>
          {milestones.map((milestone) => (
            <li
              key={milestone.id}
              className={isDone(milestone.id) ? "done" : currentMilestone?.id === milestone.id ? "current" : ""}
            />
          ))}
        </ol>
        <p>
          <span>
            {completedCount} of {milestones.length} steps complete
          </span>
        </p>
      </div>

      <section className="client-roadmap">
        {finishedSteps.length > 0 && (
          <details className="client-done">
            <summary>
              {finishedSteps.length} finished {finishedSteps.length === 1 ? "step" : "steps"}
            </summary>
            {finishedSteps.map(renderStep)}
          </details>
        )}
        {remainingSteps.map(renderStep)}
      </section>

      <section className="client-help">
        <Avatar name={transaction.owner} />
        <div>
          <h3>You’ve got a team.</h3>
          <p>{transaction.owner} is here to help with the details, the questions, and everything between.</p>
          <button className="text-button" onClick={() => onNavigate("conversation")}>
            Ask your team
            <MessageSquare size={14} />
          </button>
        </div>
      </section>

      <p className="client-safety">
        <ShieldAlert size={18} />
        <span>
          <strong>Protect your money.</strong> We will never change wiring instructions by email or text. Before you
          send any funds, call your team at a number you already know.
        </span>
      </p>
    </div>
  );
}
