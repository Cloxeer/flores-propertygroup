/**
 * ELI5: The "My tasks" page where the team sees and adds small to-dos.
 * What: Task list with filter tabs, owner filter and an add-task dialog.
 * Owns: the /tasks workspace view.
 * Depends on: HubContext, Primitives, lib/dates, lib/utils.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useSearch } from "wouter";
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { useHub } from "@/contexts/HubContext";
import { newId } from "@/lib/utils";
import { todayInDenver } from "@/lib/dates";
import { EmptyState, HubDialog, PageHeading, TaskRow } from "@/components/hub/Primitives";

type TaskFilter = "all" | "today" | "critical" | "completed";

const ALL_TEAM = "All team";

export function TasksPage({ onOpen }: { onOpen: (transactionId: string) => void }) {
  const { state, update } = useHub();
  const search = useSearch();
  const [filter, setFilter] = useState<TaskFilter>(search.includes("critical") ? "critical" : "all");
  const [ownerFilter, setOwnerFilter] = useState(ALL_TEAM);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [transactionId, setTransactionId] = useState(state.transactions[0]?.id || "");
  const [due, setDue] = useState(todayInDenver());
  const [owner, setOwner] = useState("Gabriella");
  const [critical, setCritical] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const today = todayInDenver();

  useEffect(() => {
    if (search.includes("critical")) setFilter("critical");
  }, [search]);

  const visibleTasks = state.tasks
    .filter(
      (task) =>
        (ownerFilter === ALL_TEAM || task.owner === ownerFilter) &&
        (filter === "completed" ? task.complete : !task.complete) &&
        (filter !== "today" || task.due <= today) &&
        (filter !== "critical" || task.critical),
    )
    .sort((a, b) => a.due.localeCompare(b.due));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await update((draft) =>
      draft.tasks.push({
        id: newId(),
        transactionId,
        title: title.trim(),
        due,
        owner,
        complete: false,
        critical,
        public: isPublic,
      }),
    );
    setDialogOpen(false);
    setTitle("");
    toast.success("A small step, ready for your team.");
  }

  return (
    <>
      <PageHeading
        title="Small steps. Big progress."
        description="Your team’s tasks, organized by what matters next."
        action={
          <button className="button primary" onClick={() => setDialogOpen(true)}>
            <Plus size={16} />
            Add task
          </button>
        }
      />
      <div className="page-toolbar">
        <div className="tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            All open
          </button>
          <button className={filter === "today" ? "active" : ""} onClick={() => setFilter("today")}>
            Due today
          </button>
          <button className={filter === "critical" ? "active" : ""} onClick={() => setFilter("critical")}>
            Needs attention
          </button>
          <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>
            Completed
          </button>
        </div>
        <select
          aria-label="Filter task owner"
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
        >
          <option>All team</option>
          <option>Anela</option>
          <option>Gabriella</option>
          <option>Client</option>
        </select>
      </div>
      <div className="task-page-list">
        <div className="list-label">
          <span>
            {visibleTasks.length} {filter === "completed" ? "completed" : "open"} tasks
          </span>
          <span>Mountain Time · chronological order</span>
        </div>
        {visibleTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            address={state.transactions.find((item) => item.id === task.transactionId)?.address || "Property"}
            onOpen={() => onOpen(task.transactionId)}
            onToggle={() =>
              update((draft) => {
                const target = draft.tasks.find((item) => item.id === task.id);
                if (target) target.complete = !target.complete;
              })
            }
          />
        ))}
        {visibleTasks.length === 0 && (
          <EmptyState
            title="A little breathing room."
            description="Nothing in this view needs your attention right now."
          />
        )}
      </div>
      <HubDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="One more step toward home."
        description="Give the right person a clear next action."
      >
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="span-two">
            Task
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Confirm earnest money receipt"
              maxLength={200}
            />
          </label>
          <label className="span-two">
            Transaction
            <select required value={transactionId} onChange={(event) => setTransactionId(event.target.value)}>
              <option value="">Select a home journey</option>
              {state.transactions.map((transaction) => (
                <option key={transaction.id} value={transaction.id}>
                  {transaction.address}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input required type="date" value={due} onChange={(event) => setDue(event.target.value)} />
          </label>
          <label>
            Assigned to
            <select value={owner} onChange={(event) => setOwner(event.target.value)}>
              <option>Gabriella</option>
              <option>Anela</option>
              <option>Client</option>
            </select>
          </label>
          <label className="checkbox-label span-two">
            <input type="checkbox" checked={critical} onChange={(event) => setCritical(event.target.checked)} />
            Contract-jeopardizing / critical
          </label>
          <label className="checkbox-label span-two">
            <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
            Show as client homework
          </label>
          <div className="modal-footer span-two">
            <button type="button" className="button secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </button>
            <button className="button primary" disabled={!transactionId}>
              Add task
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </HubDialog>
    </>
  );
}
