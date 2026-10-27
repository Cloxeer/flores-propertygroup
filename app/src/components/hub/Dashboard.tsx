/**
 * ELI5: The home screen: one list of what needs Anela now, today's tasks, and a pipeline glance.
 * What: Overview dashboard (Hick's-law redesign of original hD) composing summary line, attention panel, agenda and pipeline glance.
 * Owns: Derived dashboard numbers, greeting/date text, agenda tab state, attention-item selection.
 * Depends on: HubContext, wouter, AttentionPanel, PipelineGlance, DashboardMetrics, DailyAgenda, Primitives (PageHeading).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { CalendarDays, Plus } from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { OFFICE_TIME_ZONE } from "@/lib/constants";
import { todayInDenver } from "@/lib/dates";
import { PageHeading } from "./Primitives";
import { AttentionPanel, type AttentionItem } from "./AttentionPanel";
import { PipelineGlance } from "./PipelineGlance";
import { DashboardMetrics } from "./DashboardMetrics";
import { DailyAgenda, type AgendaTab } from "./DailyAgenda";
import { WelcomePanel } from "./WelcomePanel";
import { BackupNudge } from "./BackupNudge";

const NOON_HOUR = 12;
const EVENING_HOUR = 17;
const CRITICAL_TASKS_PATH = "/tasks?filter=critical";
const TRANSACTIONS_PATH = "/transactions";

export interface DashboardProps {
  onOpen: (transactionId: string) => void;
  onNew: () => void;
  search: string;
}

export function Dashboard({ onOpen, onNew, search }: DashboardProps) {
  const { state, update, userName, demo } = useHub();
  const [, navigate] = useLocation();
  const [agendaTab, setAgendaTab] = useState<AgendaTab>("today");
  const today = todayInDenver();
  const query = search.toLowerCase();
  const hasTransactions = state.transactions.length > 0;
  const openTransactions = state.transactions.filter((transaction) => transaction.stage !== "closed");
  const incompleteTasks = state.tasks.filter((task) => !task.complete);
  const dueTodayTasks = incompleteTasks.filter((task) => task.due <= today);
  const closingTransactions = openTransactions.filter((transaction) => transaction.stage === "closing");
  const currentHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: OFFICE_TIME_ZONE,
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const greeting =
    currentHour < NOON_HOUR ? "Good morning" : currentHour < EVENING_HOUR ? "Good afternoon" : "Good evening";
  const agendaTasks = state.tasks
    .filter((task) => (agendaTab === "today" ? task.due <= today : agendaTab === "upcoming" ? task.due > today : true))
    .filter((task) => (agendaTab === "completed" ? task.complete : !task.complete))
    .sort((a, b) => a.due.localeCompare(b.due));

  const attentionItems: AttentionItem[] = [];
  const criticalTasks = incompleteTasks
    .filter((task) => task.critical && task.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due));
  for (const task of criticalTasks) {
    const transaction = openTransactions.find((candidate) => candidate.id === task.transactionId);
    const alreadyListed = attentionItems.some((item) => item.transaction.id === task.transactionId);
    const matchesSearch = transaction
      ? `${transaction.address} ${transaction.client} ${transaction.city}`.toLowerCase().includes(query)
      : false;
    if (transaction && matchesSearch && !alreadyListed) {
      attentionItems.push({ transaction, task });
    }
  }

  const upcomingItems: AttentionItem[] = [];
  for (const transaction of openTransactions) {
    const nextTask = incompleteTasks
      .filter((task) => task.transactionId === transaction.id)
      .sort((a, b) => a.due.localeCompare(b.due))[0];
    const matchesSearch = `${transaction.address} ${transaction.client} ${transaction.city}`.toLowerCase().includes(query);
    if (nextTask && matchesSearch) {
      upcomingItems.push({ transaction, task: nextTask });
    }
  }
  upcomingItems.sort((a, b) => a.task.due.localeCompare(b.task.due));

  return (
    <div className="dashboard">
      <PageHeading
        title={`${greeting}, ${demo ? "Anela" : userName}.`}
        description={hasTransactions ? "Here’s what needs you today." : "Welcome to your workspace."}
        action={
          hasTransactions ? (
            <button className="button primary" onClick={onNew}>
              <Plus size={16} />
              New transaction
            </button>
          ) : undefined
        }
      />
      <div className="dashboard-date">
        <CalendarDays size={14} />
        {new Intl.DateTimeFormat("en-US", {
          timeZone: OFFICE_TIME_ZONE,
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(new Date())}
        <span>·</span>
        Mountain Time
      </div>
      {!demo && <BackupNudge state={state} />}
      {!hasTransactions ? (
        <WelcomePanel onNew={onNew} />
      ) : (
        <>
      <DashboardMetrics
        activeCount={openTransactions.length}
        dueTodayCount={dueTodayTasks.length}
        readyToCloseCount={closingTransactions.length}
      />
      <div className="dashboard-split">
        <div className="dashboard-main">
          <AttentionPanel items={attentionItems} upcoming={upcomingItems} onOpen={onOpen} onSeeAll={() => navigate(CRITICAL_TASKS_PATH)} />
          <PipelineGlance transactions={openTransactions} onOpenTransactions={() => navigate(TRANSACTIONS_PATH)} />
        </div>
        <DailyAgenda
          tab={agendaTab}
          onTabChange={setAgendaTab}
          tasks={agendaTasks}
          dueTodayCount={dueTodayTasks.length}
          transactions={state.transactions}
          onOpen={onOpen}
          onToggle={(taskId) =>
            update((draft) => {
              const task = draft.tasks.find((candidate) => candidate.id === taskId);
              if (task) {
                task.complete = !task.complete;
              }
            })
          }
          navigate={navigate}
        />
      </div>
        </>
      )}
    </div>
  );
}
