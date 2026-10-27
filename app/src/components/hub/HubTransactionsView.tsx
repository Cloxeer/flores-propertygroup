/**
 * ELI5: The "Transactions" page: heading, board of homes, and the closed-homes list.
 * What: /transactions view with search + closing-stage filter and the "New chapters, started." section.
 * Owns: filtering of transactions for this page and its markup.
 * Depends on: PipelineBoard, Primitives (PageHeading, Badge), HubContext types.
 */
import { CheckCheck, ChevronRight, Plus } from "lucide-react";
import { PipelineBoard } from "@/components/hub/PipelineBoard";
import { Badge, PageHeading } from "@/components/hub/Primitives";
import type { Transaction } from "@/lib/types";

const CLOSING_FILTER_QUERY = "stage=closing";

export interface HubTransactionsViewProps {
  transactions: Transaction[];
  search: string;
  routeSearch: string;
  onOpen: (transactionId: string) => void;
  onNew: () => void;
}

export function HubTransactionsView({
  transactions,
  search,
  routeSearch,
  onOpen,
  onNew,
}: HubTransactionsViewProps) {
  const needle = search.toLowerCase();
  const closingOnly = routeSearch.includes(CLOSING_FILTER_QUERY);
  const visible = transactions.filter(
    (transaction) =>
      `${transaction.address} ${transaction.client}`.toLowerCase().includes(needle) &&
      (!closingOnly || transaction.stage === "closing"),
  );
  const closed = transactions.filter((transaction) => transaction.stage === "closed");

  return (
    <>
      <PageHeading
        title="Every home has a journey."
        description="A clear view of every family you’re guiding, from agreement to keys."
        action={
          <button className="button primary" onClick={onNew}>
            <Plus size={16} />
            New transaction
          </button>
        }
      />
      <PipelineBoard transactions={visible} onOpen={onOpen} onNew={onNew} />
      {closed.length > 0 && (
        <div className="closed-section">
          <h2>New chapters, started.</h2>
          <div>
            {closed.map((transaction) => (
              <button key={transaction.id} onClick={() => onOpen(transaction.id)}>
                <span className="closed-icon">
                  <CheckCheck size={20} />
                </span>
                <span>
                  <strong>{transaction.address}</strong>
                  <small>{transaction.client}</small>
                </span>
                <Badge color="sage">Closed</Badge>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
