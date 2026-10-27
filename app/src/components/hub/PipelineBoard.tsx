/**
 * ELI5: The board where every home journey sits in a column for its stage.
 * What: Pipeline of open transactions with filters, board/list views, drag-to-restage and a mobile stage-tab list (original B0).
 * Owns: Pipeline view state (view, stage tab, client-type and coordinator filters) and its rendering.
 * Depends on: HubContext (state/update/useIsMobile), Primitives (Avatar, Badge, EmptyState, TransactionCard), constants.
 */
import { useState } from "react";
import { LayoutGrid, List, Plus, SlidersHorizontal } from "lucide-react";
import { useHub, useIsMobile } from "@/contexts/HubContext";
import { FALLBACK_HOME_IMAGE, PIPELINE_STAGES } from "@/lib/constants";
import type { ClientType, StageId, Transaction } from "@/lib/types";
import { Avatar, Badge, EmptyState, TransactionCard } from "./Primitives";

type PipelineView = "board" | "list";
type StageTab = "all" | StageId;
type ClientTypeFilter = "all" | ClientType;

const ALL_TEAM = "All team";
const DRAG_DATA_TYPE = "text/plain";
const OPEN_STAGES = PIPELINE_STAGES.filter((stage) => stage.id !== "closed");

export interface PipelineBoardProps {
  transactions: Transaction[];
  onOpen: (transactionId: string) => void;
  onNew: () => void;
  compact?: boolean;
}

export function PipelineBoard({ transactions, onOpen, onNew, compact = false }: PipelineBoardProps) {
  const { state, update } = useHub();
  const [view, setView] = useState<PipelineView>("board");
  const isMobile = useIsMobile();
  const [stageTab, setStageTab] = useState<StageTab>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientTypeFilter>("all");
  const [coordinator, setCoordinator] = useState<string>(ALL_TEAM);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visible = transactions.filter(
    (transaction) =>
      transaction.stage !== "closed" &&
      (coordinator === ALL_TEAM || transaction.owner === coordinator) &&
      (clientTypeFilter === "all" || transaction.clientType === clientTypeFilter),
  );
  const mobileVisible = visible.filter((transaction) => stageTab === "all" || transaction.stage === stageTab);

  return (
    <section className="pipeline-section">
      <div className="section-heading">
        <div>
          <h2>
            {compact ? "Your transaction pipeline" : "All home journeys"}
            <span className="count-pill">{visible.length}</span>
          </h2>
          <p>Every detail, moving in the right direction.</p>
        </div>
        <div className="section-tools">
          <button
            className={`icon-button ${filtersOpen ? "selected" : ""}`}
            title="Filter transactions"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={15} />
          </button>
          <div className="view-toggle" hidden={isMobile}>
            <button
              className={view === "board" ? "active" : ""}
              onClick={() => setView("board")}
              aria-label="Board view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>
      {filtersOpen && (
        <div className="pipeline-filters">
          <label>
            Representing
            <select
              value={clientTypeFilter}
              onChange={(event) => setClientTypeFilter(event.target.value as ClientTypeFilter)}
            >
              <option value="all">All clients</option>
              <option value="Buyer">Buyers</option>
              <option value="Seller">Sellers</option>
            </select>
          </label>
          <label>
            Coordinator
            <select value={coordinator} onChange={(event) => setCoordinator(event.target.value)}>
              <option>All team</option>
              <option>Anela</option>
              <option>Gabriella</option>
            </select>
          </label>
          <button
            className="text-button"
            onClick={() => {
              setCoordinator(ALL_TEAM);
              setClientTypeFilter("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {isMobile ? (
        <>
          <div className="mobile-stage-tabs" aria-label="Filter home journeys by stage">
            <button
              className={stageTab === "all" ? "active" : ""}
              aria-pressed={stageTab === "all"}
              onClick={() => setStageTab("all")}
            >
              All open
              <span className="stage-count">{visible.length}</span>
            </button>
            {OPEN_STAGES.map((stage) => (
              <button
                key={stage.id}
                className={stageTab === stage.id ? "active" : ""}
                aria-pressed={stageTab === stage.id}
                onClick={() => setStageTab(stage.id)}
              >
                {stage.label}
                <span className="stage-count">
                  {visible.filter((transaction) => transaction.stage === stage.id).length}
                </span>
              </button>
            ))}
          </div>
          <div className="mobile-pipeline-list">
            {mobileVisible.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                tasks={state.tasks}
                onOpen={() => onOpen(transaction.id)}
              />
            ))}
            {mobileVisible.length === 0 && (
              <EmptyState
                title="A little room for the next chapter."
                description="No matching home journeys in this stage. Choose another stage or clear your filters."
              />
            )}
          </div>
          <p className="mobile-pipeline-help">Tap a home for dates, tasks and the next step.</p>
        </>
      ) : view === "board" ? (
        <div className="kanban-board">
          {OPEN_STAGES.map((stage) => {
            const stageTransactions = visible.filter((transaction) => transaction.stage === stage.id);
            return (
              <div
                key={stage.id}
                className={`kanban-column column-${stage.color}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const droppedId = event.dataTransfer.getData(DRAG_DATA_TYPE);
                  if (droppedId) {
                    update((draft) => {
                      const dropped = draft.transactions.find((transaction) => transaction.id === droppedId);
                      if (dropped) {
                        dropped.stage = stage.id;
                      }
                    });
                  }
                }}
              >
                <div className="column-heading">
                  <span className={`stage-dot dot-${stage.color}`} />
                  <h3>{stage.label}</h3>
                  <span>{stageTransactions.length}</span>
                  <button onClick={onNew} aria-label={`Add transaction to ${stage.label}`}>
                    <Plus size={14} />
                  </button>
                </div>
                <div className="column-cards">
                  {stageTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData(DRAG_DATA_TYPE, transaction.id)}
                    >
                      <TransactionCard
                        transaction={transaction}
                        tasks={state.tasks}
                        onOpen={() => onOpen(transaction.id)}
                      />
                    </div>
                  ))}
                  {stageTransactions.length === 0 && (
                    <button className="column-empty" onClick={onNew}>
                      <Plus size={17} />
                      <span>A new chapter goes here</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="transaction-table">
          <div className="table-head">
            <span>Property & client</span>
            <span>Purchase price</span>
            <span>Stage</span>
            <span>Coordinator</span>
          </div>
          {visible.map((transaction) => {
            const stage = PIPELINE_STAGES.find((candidate) => candidate.id === transaction.stage);
            return (
              <button key={transaction.id} className="table-row" onClick={() => onOpen(transaction.id)}>
                <span>
                  <img src={transaction.image || FALLBACK_HOME_IMAGE} alt="Illustrative property" loading="lazy" decoding="async" />
                  <span>
                    <strong>{transaction.address}</strong>
                    <small>{transaction.client}</small>
                  </span>
                </span>
                <strong>${transaction.price.toLocaleString()}</strong>
                <Badge color={stage?.color}>{stage?.label}</Badge>
                <span>
                  <Avatar name={transaction.owner} small />
                  {transaction.owner}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
