/**
 * ELI5: A row of four stage counts so Anela sees the whole pipeline without four columns of cards.
 * What: Stage chips (count + label) that jump to the Transactions page.
 * Owns: Pipeline-at-a-glance markup.
 * Depends on: PIPELINE_STAGES, Transaction type.
 */
import { ArrowRight } from "lucide-react";
import { PIPELINE_STAGES } from "@/lib/constants";
import type { Transaction } from "@/lib/types";

export interface PipelineGlanceProps {
  transactions: Transaction[];
  onOpenTransactions: () => void;
}

export function PipelineGlance({ transactions, onOpenTransactions }: PipelineGlanceProps) {
  const openStages = PIPELINE_STAGES.filter((stage) => stage.id !== "closed");

  return (
    <section className="pipeline-glance" aria-labelledby="pipeline-glance-heading">
      <header>
        <h2 id="pipeline-glance-heading">Your pipeline</h2>
        <button className="text-button" onClick={onOpenTransactions}>
          View all transactions
          <ArrowRight size={14} />
        </button>
      </header>
      <ul>
        {openStages.map((stage) => (
          <li key={stage.id} className={`stage-${stage.color}`}>
            <strong>{transactions.filter((transaction) => transaction.stage === stage.id).length}</strong>
            <span>{stage.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
