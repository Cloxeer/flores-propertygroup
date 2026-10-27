/**
 * ELI5: The "Home Hub" a client sees after closing — a welcome, home-care tips, and helpers.
 * What: Closed-transaction hero, seasonal care checklist, essentials aside, sample vendors.
 * Owns: Post-closing journey view + the checklist's per-visit checked state.
 * Depends on: HubContext (preferences), VENDORS from SettingsPages.
 */
import { useState } from "react";
import { ArrowRight, CalendarDays, CheckCheck, FileText, House, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { FALLBACK_HOME_IMAGE } from "@/lib/constants";
import type { Transaction } from "@/lib/types";
import {
  HOME_VENDOR_PREVIEW_COUNT,
  INSPECTION_CATEGORY,
  SEASONAL_CARE_ITEMS,
  type ClientTab,
} from "./clientJourneyConstants";
import { VENDORS } from "@/lib/vendors";

export interface ClientHomeHubProps {
  transaction: Transaction;
  onNavigate: (tab: ClientTab) => void;
}

export function ClientHomeHub({ transaction, onNavigate }: ClientHomeHubProps) {
  const { state } = useHub();
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  function toggleItem(item: string): void {
    setCheckedItems((current) =>
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
    );
  }

  return (
    <>
      <div className="client-hero home-hero">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} />
            THE NEXT CHAPTER IS YOURS
          </span>
          <h1>
            Welcome home,
            <br />
            {transaction.client.split(" ")[0]}.
          </h1>
          <p>
            The keys are yours. We’re still here.
            <br />
            A little help for all the days that come next.
          </p>
          <div className="home-address">
            <House size={15} />
            {transaction.address}
          </div>
        </div>
        <img src={transaction.image || FALLBACK_HOME_IMAGE} alt="Illustrative Southwestern home" loading="lazy" decoding="async" />
        <span className="client-hero-tag">
          <CheckCheck size={15} />
          Your journey, beautifully complete.
        </span>
      </div>
      <div className="home-hub-grid">
        <section className="home-care">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A LITTLE SEASONAL CARE</span>
              <h2>Give your home some love.</h2>
            </div>
            <Leaf size={23} />
          </div>
          {state.preferences.seasonalCare ? (
            SEASONAL_CARE_ITEMS.map((item) => (
              <label className="maintenance-row" key={item}>
                <input
                  type="checkbox"
                  checked={checkedItems.includes(item)}
                  onChange={() => toggleItem(item)}
                />
                <span>{item}</span>
              </label>
            ))
          ) : (
            <p className="quiet-copy">Seasonal home care is turned off in workspace preferences.</p>
          )}
          <p className="quiet-copy">
            A general checklist, not a substitute for professional advice. Your selections are for this visit.
          </p>
        </section>
        <aside className="home-essentials">
          <span className="eyebrow">GOOD TO KEEP CLOSE</span>
          <h2>A little future-you care.</h2>
          <button onClick={() => onNavigate("documents")}>
            <FileText size={19} />
            <div>
              <strong>Your settlement statement</strong>
              <span>Keep it handy for tax-time questions.</span>
            </div>
            <ArrowRight size={14} />
          </button>
          {state.preferences.exemptionReminder && (
            <div>
              <ShieldCheck size={19} />
              <span>
                <strong>Check property tax exemptions</strong>
                <p>
                  Ask your county assessor about eligibility, documents and local filing dates. No eligibility determination is made here.
                </p>
              </span>
            </div>
          )}
          {state.preferences.taxReminder && (
            <p className="form-note">
              <CalendarDays size={16} />
              Tax-time email delivery is not connected. Your statement remains in Key Documents.
            </p>
          )}
        </aside>
      </div>
      <div className="home-vendors">
        <div className="section-heading">
          <div>
            <h2>For the little things along the way.</h2>
            <p>A place for trusted local helping hands.</p>
          </div>
        </div>
        <div className="home-vendor-list">
          {VENDORS.filter((vendor) => vendor.category !== INSPECTION_CATEGORY)
            .slice(0, HOME_VENDOR_PREVIEW_COUNT)
            .map((vendor) => (
              <article key={vendor.name}>
                <span className={`vendor-mark ${vendor.color}`}>
                  <vendor.icon size={20} />
                </span>
                <div>
                  <h3>{vendor.category}</h3>
                  <p>{vendor.name}</p>
                  <small>Fictional sample · not a verified provider</small>
                </div>
              </article>
            ))}
        </div>
      </div>
    </>
  );
}
