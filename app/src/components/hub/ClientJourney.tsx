/**
 * ELI5: The quiet "client view" — what a buyer or seller sees about their own deal.
 * What: Journey shell: preview bar, tab navigation, offline save, tab slots, footer, inspector picker dialog.
 * Owns: Selected transaction, active tab, inspector dialog state; lays out ClientRoadmap / ClientHomeHub / ClientTeam / documents.
 * Depends on: HubContext, wouter, ClientRoadmap, ClientHomeHub, ClientTeam, DocumentsPage, VENDORS (SettingsPages).
 */
import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { ArrowRight, Download, FileText, House, MessageSquare, ShieldCheck } from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { calculateContractDeadlines } from "@/lib/contract";
import { saveOfflineSnapshot } from "@/lib/offline";
import { Badge, EmptyState, HubDialog } from "./Primitives";
import { DocumentsPage } from "./DocumentsPage";
import { VENDORS } from "@/lib/vendors";
import { ClientHomeHub } from "./ClientHomeHub";
import { ClientRoadmap } from "./ClientRoadmap";
import { ClientTeam } from "./ClientTeam";
import {
  CLIENT_LOGO_SRC,
  CLIENT_OFFLINE_CONFIRM,
  CLIENT_OFFLINE_DEMO_SCOPE,
  CLIENT_OFFLINE_FALLBACK_SCOPE,
  CLIENT_PREVIEW_PATH,
  DEFAULT_CLIENT_TAB,
  HIDDEN_CLIENT_MILESTONES,
  INSPECTION_CATEGORY,
  type ClientTab,
} from "./clientJourneyConstants";

export interface ClientJourneyProps {
  external?: boolean;
  forceHome?: boolean;
  transactionId?: string;
  offlineScope?: string;
}

function parseClientTab(value: string | null): ClientTab {
  if (value === "documents" || value === "conversation" || value === "journey") return value;
  return DEFAULT_CLIENT_TAB;
}

export function ClientJourney({
  external = false,
  forceHome = false,
  transactionId,
  offlineScope,
}: ClientJourneyProps) {
  const { state, selectInspector, offlineScope: hubOfflineScope } = useHub();
  const [, navigate] = useLocation();
  const search = useSearch();
  const [selectedId, setSelectedId] = useState<string>(
    transactionId ||
      state.transactions.find((entry) =>
        forceHome ? entry.stage === "closed" : entry.stage !== "closed",
      )?.id ||
      state.transactions[0]?.id ||
      "",
  );
  const [tab, setTab] = useState<ClientTab>(parseClientTab(new URLSearchParams(search).get("tab")));
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const transaction = state.transactions.find((entry) => entry.id === selectedId);
  const isHome = forceHome || transaction?.stage === "closed";
  const deadlines = transaction ? calculateContractDeadlines(transaction.terms) : [];
  const milestones = deadlines.filter((entry) => !HIDDEN_CLIENT_MILESTONES.includes(entry.id));
  const currentMilestone = milestones.find(
    (entry) => !transaction?.completedMilestones.includes(entry.id),
  );
  const completedCount = milestones.filter((entry) =>
    transaction?.completedMilestones.includes(entry.id),
  ).length;
  const homeworkTasks = state.tasks.filter(
    (task) => task.transactionId === transaction?.id && task.public && !task.complete,
  );
  const clientMessages = state.messages.filter(
    (message) => message.transactionId === transaction?.id && !message.internal,
  );

  function goToTab(nextTab: ClientTab): void {
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!external) navigate(`${CLIENT_PREVIEW_PATH}?tab=${nextTab}`);
  }

  if (!transaction) {
    return (
      <EmptyState
        title="Every journey starts somewhere."
        description="Create a transaction in Team mode to preview your client’s roadmap."
      />
    );
  }

  function saveOffline(): void {
    if (!transaction || !window.confirm(CLIENT_OFFLINE_CONFIRM)) return;
    const scope = external
      ? offlineScope || CLIENT_OFFLINE_FALLBACK_SCOPE
      : hubOfflineScope || CLIENT_OFFLINE_DEMO_SCOPE;
    saveOfflineSnapshot(
      {
        ...state,
        transactions: [transaction],
        documents: state.documents.filter(
          (document) => document.transactionId === transaction.id && document.published,
        ),
      },
      scope,
    )
      .then(() => toast.success("Dates and published PDFs saved on this device for 24 hours."))
      .catch(() => toast.error("This device could not save an offline copy."));
  }

  return (
    <div className={`client-experience ${external ? "external-client" : ""}`}>
      {!external && (
        <div className="client-preview-bar">
          <Badge color="gold">Client preview</Badge>
          <span>A quieter view, just for your client.</span>
          <select
            aria-label="Preview a client transaction"
            value={selectedId}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setTab(DEFAULT_CLIENT_TAB);
            }}
          >
            {state.transactions.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.client} · {entry.address}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="client-navigation">
        <button className={tab === "journey" ? "active" : ""} onClick={() => goToTab("journey")}>
          <House size={15} />
          {isHome ? "Home Hub" : "My journey"}
        </button>
        <button className={tab === "documents" ? "active" : ""} onClick={() => goToTab("documents")}>
          <FileText size={15} />
          Key documents
        </button>
        <button
          className={tab === "conversation" ? "active" : ""}
          onClick={() => goToTab("conversation")}
        >
          <MessageSquare size={15} />
          My team
        </button>
        <button className="client-offline" onClick={saveOffline}>
          <Download size={14} />
          Save offline
        </button>
      </div>
      {tab === "documents" ? (
        <DocumentsPage clientTxId={transaction.id} />
      ) : tab === "conversation" ? (
        <ClientTeam transaction={transaction} messages={clientMessages} milestones={deadlines} />
      ) : isHome ? (
        <ClientHomeHub transaction={transaction} onNavigate={goToTab} />
      ) : (
        <ClientRoadmap
          transaction={transaction}
          milestones={milestones}
          currentMilestone={currentMilestone}
          completedCount={completedCount}
          homeworkTasks={homeworkTasks}
          onChooseInspector={() => setInspectorOpen(true)}
          onNavigate={goToTab}
        />
      )}
      <div className="client-footer">
        <img src={CLIENT_LOGO_SRC} alt="Flores Property Group logo" />
        <p>Real people. Thoughtful guidance. A place to call home.</p>
      </div>
      <HubDialog
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        title="A closer look. A confident next step."
        description="Choose an inspector and let your team coordinate the details."
      >
        <div className="form-note">
          <ShieldCheck size={16} />
          These are fictional demo providers. Ask your team for verified local inspectors before a real selection.
        </div>
        {VENDORS.filter((vendor) => vendor.category === INSPECTION_CATEGORY).map((vendor) => (
          <button
            className="inspector-option"
            key={vendor.name}
            onClick={() => selectInspector(transaction, vendor.name).then(() => setInspectorOpen(false))}
          >
            <span className={`vendor-mark ${vendor.color}`}>
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>{vendor.name}</h3>
              <p>{vendor.description}</p>
            </div>
            <ArrowRight size={17} />
          </button>
        ))}
      </HubDialog>
    </div>
  );
}
