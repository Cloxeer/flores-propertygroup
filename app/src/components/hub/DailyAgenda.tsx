/**
 * ELI5: The "Your day, in order" side panel with today/upcoming/done tabs and a thank-you note.
 * What: Agenda aside listing up to six filtered tasks, toggling completion through a callback.
 * Owns: Agenda tab rendering and the team note card.
 * Depends on: Primitives (Avatar, TaskRow), Task/Transaction types, lucide icons.
 */
import { ArrowRight, CheckCheck, Sparkles, Sun } from "lucide-react";
import type { Task, Transaction } from "@/lib/types";
import { Avatar, TaskRow } from "./Primitives";

export type AgendaTab = "today" | "upcoming" | "completed";

const AGENDA_LIMIT = 6;

export interface DailyAgendaProps {
  tab: AgendaTab;
  onTabChange: (tab: AgendaTab) => void;
  tasks: Task[];
  dueTodayCount: number;
  transactions: Transaction[];
  onOpen: (transactionId: string) => void;
  onToggle: (taskId: string) => void;
  navigate: (path: string) => void;
}

export function DailyAgenda({
  tab,
  onTabChange,
  tasks,
  dueTodayCount,
  transactions,
  onOpen,
  onToggle,
  navigate,
}: DailyAgendaProps) {
  return (
    <aside className="daily-agenda">
      <div className="section-heading">
        <div>
          <h2>Your day, in order.</h2>
          <p>Small steps. Big progress.</p>
        </div>
        <span className="agenda-icon">
          <Sun size={22} />
        </span>
      </div>
      <div className="agenda-tabs">
        <button className={tab === "today" ? "active" : ""} onClick={() => onTabChange("today")}>
          Today
          <span>{dueTodayCount}</span>
        </button>
        <button className={tab === "upcoming" ? "active" : ""} onClick={() => onTabChange("upcoming")}>
          Upcoming
        </button>
        <button
          className={tab === "completed" ? "active" : ""}
          onClick={() => onTabChange("completed")}
          aria-label="Completed tasks"
        >
          <CheckCheck size={15} />
        </button>
      </div>
      <div className="agenda-list">
        {tasks.slice(0, AGENDA_LIMIT).map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            address={transactions.find((transaction) => transaction.id === task.transactionId)?.address || ""}
            onOpen={() => onOpen(task.transactionId)}
            onToggle={() => onToggle(task.id)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="agenda-empty">
            <CheckCheck size={30} />
            <h3>A little breathing room.</h3>
            <p>{tab === "completed" ? "Completed tasks will appear here." : "You’re all caught up here."}</p>
          </div>
        )}
      </div>
      <button className="agenda-all" onClick={() => navigate("/tasks")}>
        View all tasks
        <ArrowRight size={14} />
      </button>
      <div className="team-note">
        <span className="note-label">
          <Sparkles size={13} />
          A NOTE FOR YOUR TEAM
        </span>
        <h3>
          Behind every closing,
          <br />
          there’s a little teamwork.
        </h3>
        <p>Thanks for making home feel closer.</p>
        <div>
          <Avatar name="Anela" small />
          <Avatar name="Gabriella" small />
          <span>Flores Property Group</span>
        </div>
      </div>
    </aside>
  );
}
