/**
 * ELI5: The "connections" page, showing which outside tools could link up (none do yet) and exporting your data.
 * What: Integrations view (original `ED`, SettingsPages.tsx).
 * Owns: integration catalog, setup-requirements dialog, workspace JSON export.
 * Depends on: HubContext (state), Primitives (HubDialog, PageHeading, Badge), downloadFile, sonner.
 */
import { useState } from "react";
import { ArrowRight, Check, Download, FileText, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { useHub } from "@/contexts/HubContext";
import type { BadgeColor } from "@/lib/types";
import { Badge, HubDialog, PageHeading } from "@/components/hub/Primitives";
import { downloadFile } from "@/components/hub/downloadFile";

interface Integration {
  name: string;
  mark: string;
  color: string;
  description: string;
  scope: string;
}

const INTEGRATIONS: Integration[] = [
  {
    name: "KW Command",
    mark: "kw",
    color: "#b44444",
    description: "Keep contacts, opportunities and transaction details aligned.",
    scope: "Contacts, opportunities, dates and task mapping",
  },
  {
    name: "Flexmls",
    mark: "flex",
    color: "#477891",
    description: "Bring listing context into each home journey.",
    scope: "Authorized listing data and property metadata",
  },
  {
    name: "Trello",
    mark: "▥",
    color: "#4386b9",
    description: "Help your transaction checklists work together.",
    scope: "Boards, cards, due dates and checklist mapping",
  },
  {
    name: "Folio",
    mark: "f",
    color: "#5b859a",
    description: "Connect the timeline to your transaction conversations.",
    scope: "Transaction timelines and contact mapping",
  },
  {
    name: "Google Workspace",
    mark: "G",
    color: "#53876c",
    description: "Keep your calendar and important work in sync.",
    scope: "Calendar, contacts, document references and email",
  },
];

const EXPORT_FILE_NAME = "flores-workspace-export.json";

export function IntegrationsPage() {
  const { state } = useHub();
  const [selected, setSelected] = useState<Integration | null>(null);

  function exportWorkspace() {
    // PDF bytes are stripped so the export stays small and readable.
    const exported = {
      ...state,
      documents: state.documents.map(({ data: _data, ...rest }) => rest),
    };
    downloadFile(EXPORT_FILE_NAME, JSON.stringify(exported, null, 2), "application/json");
    toast.success("Workspace export downloaded. PDF bytes are not included.");
  }

  return (
    <>
      <PageHeading
        title="Less double entry. More together."
        description="Your ecosystem, with clear connections and a single place to keep moving."
        action={
          <button className="button secondary" onClick={exportWorkspace}>
            <Download size={15} />
            Export workspace
          </button>
        }
      />
      <div className="integration-notice">
        <span className="metric-icon gold">
          <PlugZap size={22} />
        </span>
        <div>
          <h3>Ready for connections. Not pretending to be connected.</h3>
          <p>
            External API adapters and credentials are still needed. This app does not currently read
            or write to your CRM, boards, email or calendar.
          </p>
        </div>
      </div>
      <div className="integration-grid">
        {INTEGRATIONS.map((integration) => (
          <article key={integration.name} className="integration-card">
            <div>
              <span className="integration-logo" style={{ color: integration.color }}>
                {integration.mark}
              </span>
              {/* "neutral" is a valid badge style in hub.css but absent from the BadgeColor union. */}
              <Badge color={"neutral" as BadgeColor}>Not connected</Badge>
            </div>
            <h3>{integration.name}</h3>
            <p>{integration.description}</p>
            <button className="button secondary" onClick={() => setSelected(integration)}>
              View setup requirements
              <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </div>
      <div className="integration-export">
        <FileText size={22} />
        <div>
          <h3>A practical bridge for now.</h3>
          <p>
            Export a workspace JSON here, or download milestone dates as an .ics file from Calendar.
            Neither action enables live two-way sync.
          </p>
        </div>
      </div>
      <HubDialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`${selected?.name || ""} connection requirements`}
        description="Connect the real thing. Keep your client data protected."
      >
        <div className="provider-details">
          <span>Data scope</span>
          <strong>{selected?.scope}</strong>
          <span>What’s needed</span>
          <strong>
            Provider-approved API access, server-side credentials, field mapping, webhook/retry
            handling and permission review.
          </strong>
          <span>Current status</span>
          <strong>No adapter connected. No external data is being read or written.</strong>
        </div>
        <p className="quiet-copy">
          Connecting a service to your Manus account does not by itself connect this application’s
          runtime. Never paste API secrets into messages or client-side code.
        </p>
        <button className="button primary" onClick={() => setSelected(null)}>
          Understood
          <Check size={14} />
        </button>
      </HubDialog>
    </>
  );
}
