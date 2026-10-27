/**
 * ELI5: The pop-up form where you add a new home or fix its contract dates.
 * What: New/edit transaction dialog with contract-date inputs, live milestone preview, and save logic
 *       that creates/updates the transaction and its contract tasks.
 * Owns: TransactionFormDialog and its field-change helper.
 * Depends on: HubContext (update), Primitives (HubDialog), lib/contract, lib/dates, lib/constants.
 */
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, CalendarDays, CircleAlert, LockKeyhole } from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { HubDialog } from "@/components/hub/Primitives";
import { calculateContractDeadlines } from "@/lib/contract";
import { formatDate, todayInDenver } from "@/lib/dates";
import { HOME_IMAGES } from "@/lib/constants";
import { newId } from "@/lib/utils";
import type { ClientType, ContractDeadline, Transaction, TransactionTerms } from "@/lib/types";

const DEFAULT_CITY = "Las Cruces, NM";
const DEFAULT_OWNER = "Gabriella";
const DAYS_FIELD_SUFFIX = "Days";
const CONTRACT_TASK_PREFIX = "contract-";
const CRITICAL_MILESTONES: string[] = ["earnest", "inspection", "resolution", "title"];
const PUBLIC_MILESTONES: string[] = ["earnest", "walkthrough", "settlement"];

type TermKey = keyof TransactionTerms;

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  existing?: Transaction;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function initialTerms(existing: Transaction | undefined): TransactionTerms {
  if (existing) {
    return {
      inspectionAnchor: "acceptance",
      documentsAnchor: "acceptance",
      ...existing.terms,
    };
  }
  return {
    acceptance: todayInDenver(),
    settlement: "",
    inspectionAnchor: "acceptance",
    documentsAnchor: "acceptance",
    earnestDays: 3,
    earnestAnchor: "acceptance",
    resolutionDays: 5,
    titleDays: 7,
    walkThroughDays: 3,
    repairDays: 3,
  };
}

export function TransactionFormDialog({ open, onClose, existing }: TransactionFormDialogProps) {
  const { update, demo } = useHub();
  const [address, setAddress] = useState(existing?.address || "");
  const [client, setClient] = useState(existing?.client || "");
  const [city, setCity] = useState(existing?.city || DEFAULT_CITY);
  const [price, setPrice] = useState(String(existing?.price || ""));
  const [clientType, setClientType] = useState<ClientType>(existing?.clientType || "Buyer");
  const [owner, setOwner] = useState(existing?.owner || DEFAULT_OWNER);
  const [terms, setTerms] = useState<TransactionTerms>(initialTerms(existing));
  const [saving, setSaving] = useState(false);

  const setTerm = (field: TermKey, value: string) =>
    setTerms((previous) => ({
      ...previous,
      [field]: field.endsWith(DAYS_FIELD_SUFFIX)
        ? value === ""
          ? undefined
          : Number(value)
        : value || undefined,
    }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      calculateContractDeadlines(terms);
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }
    if (!address.trim() || !client.trim() || !terms.settlement) return;
    if (terms.acceptance && terms.settlement < terms.acceptance) {
      toast.error("Settlement cannot be earlier than acceptance.");
      return;
    }
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      toast.error("Enter a positive purchase price.");
      return;
    }
    setSaving(true);
    try {
      await update((draft) => {
        if (existing) {
          const transaction = draft.transactions.find((item) => item.id === existing.id);
          if (transaction) {
            Object.assign(transaction, {
              address,
              city,
              client,
              price: Number(price),
              clientType,
              owner,
              terms,
            });
            const deadlines = calculateContractDeadlines(terms);
            const taskPrefix = `${CONTRACT_TASK_PREFIX}${transaction.id}-`;
            draft.tasks = draft.tasks.filter(
              (task) =>
                !task.id.startsWith(taskPrefix) ||
                task.complete ||
                deadlines.some((deadline) => deadline.id === task.milestoneId && deadline.date),
            );
            draft.tasks
              .filter((task) => task.id.startsWith(taskPrefix))
              .forEach((task) => {
                const deadline = deadlines.find((item) => item.id === task.milestoneId);
                if (deadline?.date) task.due = deadline.date;
              });
          }
        } else {
          const transactionId = newId();
          draft.transactions.unshift({
            id: transactionId,
            address,
            city,
            client,
            clientType,
            owner,
            price: Number(price),
            stage: "under-contract",
            image: HOME_IMAGES[draft.transactions.length % 3],
            createdAt: new Date().toISOString(),
            terms,
            completedMilestones: [],
          });
          calculateContractDeadlines(terms).forEach((deadline) => {
            if (!deadline.date) return;
            draft.tasks.push({
              id: `${CONTRACT_TASK_PREFIX}${transactionId}-${deadline.id}`,
              transactionId,
              title: deadline.label,
              due: deadline.date,
              owner,
              complete: false,
              critical: CRITICAL_MILESTONES.includes(deadline.id),
              public: PUBLIC_MILESTONES.includes(deadline.id),
              milestoneId: deadline.id,
            });
          });
        }
        draft.activity.unshift({
          id: newId(),
          text: existing
            ? `Contract dates updated for ${address}.`
            : `A new journey started for ${client}.`,
          createdAt: new Date().toISOString(),
        });
      });
      toast.success(existing ? "Transaction and contract dates updated." : "A new home journey is ready.");
      onClose();
    } catch {
      // update() already surfaces its own error toast
    } finally {
      setSaving(false);
    }
  }

  let deadlines: ContractDeadline[] = [];
  let deadlineError = "";
  try {
    deadlines = calculateContractDeadlines(terms);
  } catch (error) {
    deadlineError = errorMessage(error);
  }

  return (
    <HubDialog
      open={open}
      onClose={onClose}
      title={existing ? "Transaction & contract dates" : "Start a new home journey"}
      description="A few details now. A clearer path all the way to closing."
      wide
    >
      <form onSubmit={handleSubmit} className="transaction-form">
        {!demo && (
          <p className="form-note">
            <LockKeyhole size={16} />
            <span>Saved only on this device. Names, streets and dates are plenty; please skip loan numbers, SSNs and bank details.</span>
          </p>
        )}
        <div className="form-grid">
          <label className="span-two">
            Property address
            <input
              required
              placeholder="e.g. 1842 Desert Willow Dr"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={200}
            />
          </label>
          <label>
            City & state
            <input required value={city} onChange={(event) => setCity(event.target.value)} />
          </label>
          <label>
            Purchase price ($)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="425000"
            />
          </label>
          <label className="span-two">
            Client name(s)
            <input
              required
              placeholder="Who are we guiding home?"
              value={client}
              onChange={(event) => setClient(event.target.value)}
              maxLength={200}
            />
          </label>
          <label>
            Representing
            <select value={clientType} onChange={(event) => setClientType(event.target.value as ClientType)}>
              <option>Buyer</option>
              <option>Seller</option>
            </select>
          </label>
          <label>
            Transaction coordinator
            <select value={owner} onChange={(event) => setOwner(event.target.value)}>
              <option>Gabriella</option>
              <option>Anela</option>
            </select>
          </label>
        </div>
        <div className="form-section-title">
          <CalendarDays size={17} />
          <h3>Let the dates do the organizing.</h3>
          <span>NMAR 2104 · Sept 2026</span>
        </div>
        <div className="form-note">
          <CircleAlert size={16} />
          <span>
            Use the selections in the signed agreement. Blank negotiated dates remain “Needs input.” These
            calculations do not replace brokerage review.
          </span>
        </div>
        <div className="form-grid">
          <label>
            Date of acceptance
            <input
              required
              type="date"
              value={terms.acceptance}
              onChange={(event) => setTerm("acceptance", event.target.value)}
            />
          </label>
          <label>
            Settlement / signing date
            <input
              required
              type="date"
              value={terms.settlement}
              onChange={(event) => setTerm("settlement", event.target.value)}
            />
          </label>
        </div>
        <details className="form-advanced">
          <summary>Contract timing (optional)</summary>
          <div className="form-grid">
          <label>
            Earnest money · days
            <input
              type="number"
              min="1"
              max="365"
              value={terms.earnestDays ?? ""}
              placeholder="3 if blank"
              onChange={(event) => setTerm("earnestDays", event.target.value)}
            />
          </label>
          <label>
            Earnest money anchor
            <select
              value={terms.earnestAnchor || "acceptance"}
              onChange={(event) => setTerm("earnestAnchor", event.target.value)}
            >
              <option value="acceptance">Date of acceptance</option>
              <option value="inspection">Inspection objection deadline</option>
              <option value="resolution">Actual resolution date (enter fixed date)</option>
            </select>
          </label>
          <label>
            Earnest money · specific deadline
            <input
              type="date"
              value={terms.earnestDate || ""}
              onChange={(event) => setTerm("earnestDate", event.target.value)}
            />
          </label>
          <label>
            Independent consideration delivery
            <input
              type="date"
              value={terms.independentConsideration || ""}
              onChange={(event) => setTerm("independentConsideration", event.target.value)}
            />
          </label>
          <label>
            Inspection objection · specific date
            <input
              type="date"
              value={terms.inspectionDate || ""}
              onChange={(event) => setTerm("inspectionDate", event.target.value)}
            />
          </label>
          <label>
            Or negotiated inspection days
            <input
              type="number"
              min="1"
              max="365"
              value={terms.inspectionDays ?? ""}
              placeholder="No contract default"
              onChange={(event) => setTerm("inspectionDays", event.target.value)}
            />
          </label>
          <label>
            Inspection anchor
            <select
              value={terms.inspectionAnchor || "acceptance"}
              onChange={(event) => setTerm("inspectionAnchor", event.target.value)}
            >
              <option value="acceptance">Date of acceptance</option>
              <option value="independentConsideration">Independent consideration delivery</option>
            </select>
          </label>
          <label>
            Resolution · specific date
            <input
              type="date"
              value={terms.resolutionDate || ""}
              onChange={(event) => setTerm("resolutionDate", event.target.value)}
            />
          </label>
          <label>
            Or resolution days after objections
            <input
              type="number"
              min="1"
              max="365"
              placeholder="5 if blank"
              value={terms.resolutionDays ?? ""}
              onChange={(event) => setTerm("resolutionDays", event.target.value)}
            />
          </label>
          <label>
            Existing document delivery · specific date
            <input
              type="date"
              value={terms.documentsDate || ""}
              onChange={(event) => setTerm("documentsDate", event.target.value)}
            />
          </label>
          <label>
            Or negotiated document delivery days
            <input
              type="number"
              min="1"
              max="365"
              value={terms.documentsDays ?? ""}
              placeholder="No contract default"
              onChange={(event) => setTerm("documentsDays", event.target.value)}
            />
          </label>
          <label>
            Document delivery anchor
            <select
              value={terms.documentsAnchor || "acceptance"}
              onChange={(event) => setTerm("documentsAnchor", event.target.value)}
            >
              <option value="acceptance">Date of acceptance</option>
              <option value="independentConsideration">Independent consideration delivery</option>
            </select>
          </label>
          <label>
            Title commitment received
            <input
              type="date"
              value={terms.titleReceipt || ""}
              onChange={(event) => setTerm("titleReceipt", event.target.value)}
            />
          </label>
          <label>
            Title review · days after receipt
            <input
              type="number"
              min="1"
              max="365"
              placeholder="7 if blank"
              value={terms.titleDays ?? ""}
              onChange={(event) => setTerm("titleDays", event.target.value)}
            />
          </label>
          <label>
            Walk-through · specific agreed date
            <input
              type="date"
              value={terms.walkThroughDate || ""}
              onChange={(event) => setTerm("walkThroughDate", event.target.value)}
            />
          </label>
          <label>
            Walk-through window · days before signing
            <input
              type="number"
              min="1"
              max="365"
              placeholder="3 if blank"
              value={terms.walkThroughDays ?? ""}
              onChange={(event) => setTerm("walkThroughDays", event.target.value)}
            />
          </label>
          <label>
            Repairs · days before signing
            <input
              type="number"
              min="1"
              max="365"
              placeholder="3 if blank"
              value={terms.repairDays ?? ""}
              onChange={(event) => setTerm("repairDays", event.target.value)}
            />
          </label>
        </div>
        {deadlineError && <p className="form-note">{deadlineError}</p>}
        <div className="date-preview">
          <h4>Your calculated milestones</h4>
          {deadlines.map((deadline) => (
            <div key={deadline.id}>
              <span>{deadline.label}</span>
              <strong>{deadline.date ? formatDate(deadline.date) : "Needs input"}</strong>
            </div>
          ))}
        </div>
        </details>
        <div className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={saving}>
            {saving ? "Saving…" : existing ? "Save transaction" : "Create transaction"}
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </HubDialog>
  );
}
