/**
 * ELI5: The "good people nearby" page, a directory of sample service providers.
 * What: Vendors view, also used in inspector-only mode as the inspector picker (original `jD`, SettingsPages.tsx).
 * Owns: vendor catalog, category filter, provider dialog, inspector selection flow.
 * Depends on: HubContext (state, selectInspector), Primitives (HubDialog, PageHeading, Badge).
 */
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Hammer,
  Leaf,
  ShieldCheck,
  Snowflake,
  Wrench,
} from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { VENDORS } from "@/lib/vendors";
import type { BadgeColor } from "@/lib/types";
import { Badge, HubDialog, PageHeading } from "@/components/hub/Primitives";

const ALL_SERVICES = "All services";
const INSPECTION_CATEGORY = "Home inspections";
const VENDOR_CATEGORIES: string[] = [
  ALL_SERVICES,
  INSPECTION_CATEGORY,
  "Plumbing",
  "Heating & cooling",
  "Landscaping",
  "Home maintenance",
];

export interface VendorsPageProps {
  /** Show only inspectors, without the category filter (inspector picker). */
  inspectorOnly?: boolean;
  /** Pre-selected transaction in the inspector dialog. */
  transactionId?: string;
}

export function VendorsPage({ inspectorOnly = false, transactionId }: VendorsPageProps) {
  const { state, selectInspector } = useHub();
  const [category, setCategory] = useState<string>(ALL_SERVICES);
  const [selectedVendorName, setSelectedVendorName] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>(
    transactionId || state.transactions.find((t) => t.stage === "inspection")?.id || "",
  );

  const visibleVendors = VENDORS.filter(
    (vendor) =>
      (!inspectorOnly || vendor.category === INSPECTION_CATEGORY) &&
      (category === ALL_SERVICES || vendor.category === category),
  );
  const selectedTransaction = state.transactions.find((t) => t.id === selectedTransactionId);

  async function confirmInspector() {
    if (!selectedVendorName || !selectedTransaction) return;
    await selectInspector(selectedTransaction, selectedVendorName);
    setSelectedVendorName(null);
  }

  return (
    <>
      <PageHeading
        title={inspectorOnly ? "Choose a helping hand." : "Good people. A little closer."}
        description="A place for your team’s go-to service providers, from inspection to everyday home care."
      />
      <div className="form-note">
        <CircleAlert size={16} />
        <span>
          Demo directory: these are fictional sample providers, not verified recommendations.
          Replace them with your approved local vendors before inviting real clients.
        </span>
      </div>
      {!inspectorOnly && (
        <div className="vendor-filters">
          {VENDOR_CATEGORIES.map((name) => (
            <button
              key={name}
              className={category === name ? "active" : ""}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="vendor-grid">
        {visibleVendors.map((vendor) => (
          <article key={vendor.name} className="vendor-card">
            <div className="vendor-top">
              <span className={`vendor-mark ${vendor.color}`}>
                <vendor.icon size={25} />
              </span>
              <Badge color={vendor.color}>Sample provider</Badge>
            </div>
            <h3>{vendor.name}</h3>
            <span className="vendor-category">{vendor.category}</span>
            <p>{vendor.description}</p>
            <div className="vendor-location">Las Cruces & Mesilla Valley · Demo</div>
            <button className="button secondary" onClick={() => setSelectedVendorName(vendor.name)}>
              {vendor.category === INSPECTION_CATEGORY ? "Select inspector" : "View provider details"}
              <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </div>
      <HubDialog
        open={!!selectedVendorName}
        onClose={() => setSelectedVendorName(null)}
        title={selectedVendorName || "Provider"}
        description="A little clarity before your next step."
      >
        {VENDORS.find((vendor) => vendor.name === selectedVendorName)?.category ===
        INSPECTION_CATEGORY ? (
          <>
            <label className="form-label">
              Choose the home journey
              <select
                value={selectedTransactionId}
                onChange={(event) => setSelectedTransactionId(event.target.value)}
              >
                {state.transactions
                  .filter((transaction) => transaction.stage !== "closed")
                  .map((transaction) => (
                    <option key={transaction.id} value={transaction.id}>
                      {transaction.address}
                    </option>
                  ))}
              </select>
            </label>
            <div className="form-note">
              <CalendarDays size={16} />
              <span>
                Your roadmap will move to “Pending inspection.” Gabriella will receive a scheduling
                task and a vendor SMS draft. No message is sent automatically.
              </span>
            </div>
            <button
              className="button primary"
              onClick={confirmInspector}
              disabled={!selectedTransaction}
            >
              Confirm inspector
              <Check size={14} />
            </button>
          </>
        ) : (
          <>
            <p className="quiet-copy">
              This is a fictional example of a provider your team can add to its directory. No real
              contact information or booking is available.
            </p>
            <div className="provider-details">
              <span>Service area</span>
              <strong>Las Cruces & Mesilla Valley</strong>
              <span>Verification</span>
              <strong>Sample only · not verified</strong>
            </div>
          </>
        )}
      </HubDialog>
    </>
  );
}
