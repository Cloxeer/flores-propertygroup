/**
 * ELI5: The settings page, with notification switches, which workspace you are in, and offline saving.
 * What: Settings view (original `TD`, SettingsPages.tsx).
 * Owns: preference toggles, demo/private workspace switch, offline snapshot save/clear.
 * Depends on: HubContext, Primitives (PageHeading, Badge), offline lib, sonner.
 */
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  CircleAlert,
  Download,
  FileText,
  KeyRound,
  Leaf,
  LockKeyhole,
  Mail,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useHub } from "@/contexts/HubContext";
import { clearOfflineData, hasOfflineSnapshot, saveOfflineSnapshot } from "@/lib/offline";
import type { PreferenceKey } from "@/lib/types";
import { DataSafetyPanel } from "@/components/hub/DataSafetyPanel";
import { Badge, PageHeading } from "@/components/hub/Primitives";

interface PreferenceOption {
  key: PreferenceKey;
  title: string;
  description: string;
  icon: LucideIcon;
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    key: "criticalSMS",
    title: "Critical deadlines · SMS first",
    description: "Prepare SMS drafts for time-sensitive, contract-jeopardizing tasks.",
    icon: Smartphone,
  },
  {
    key: "inApp",
    title: "Everyday updates · in app",
    description: "Keep standard updates in the workspace activity feed.",
    icon: Bell,
  },
  {
    key: "phaseEmail",
    title: "Completed milestones · email",
    description: "Prepare a summary draft when a phase is marked complete.",
    icon: Mail,
  },
  {
    key: "seasonalCare",
    title: "Seasonal home care",
    description: "Keep maintenance checklists available in the Home Hub.",
    icon: Leaf,
  },
  {
    key: "taxReminder",
    title: "Tax-time settlement statement",
    description: "Show tax-time reminders and settlement-statement access in the Home Hub.",
    icon: FileText,
  },
  {
    key: "exemptionReminder",
    title: "Local property tax exemption reminders",
    description: "Show a reminder to check eligibility and county filing requirements.",
    icon: KeyRound,
  },
];

export function SettingsPage() {
  const [, navigate] = useLocation();
  const { state, update, offlineScope } = useHub();
  const [hasOfflineCopy, setHasOfflineCopy] = useState<boolean>(hasOfflineSnapshot());
  const [savingOffline, setSavingOffline] = useState<boolean>(false);

  async function saveForOffline() {
    setSavingOffline(true);
    try {
      if (!offlineScope) throw new Error("Sign in to save a private offline copy.");
      await saveOfflineSnapshot(state, offlineScope);
      setHasOfflineCopy(true);
      toast.success("Key dates and published documents saved on this device for 24 hours.");
    } catch {
      toast.error("Offline storage could not be enabled on this device.");
    } finally {
      setSavingOffline(false);
    }
  }

  function togglePreference(key: PreferenceKey) {
    void update((draft) => {
      draft.preferences[key] = !draft.preferences[key];
    });
  }

  return (
    <>
      <PageHeading
        title="Make room for the way you work."
        description="Thoughtful defaults, clear preferences, and your data under your control."
      />
      <button className="connections-link" onClick={() => navigate("/integrations")}>
        <span>
          <strong>Connections</strong>
          CRM, calendar and email — see what can be linked
        </span>
        <ChevronRight size={18} />
      </button>
      <DataSafetyPanel />
      <div className="settings-layout">
        <section className="settings-panel">
          <div className="settings-heading">
            <Bell size={18} />
            <h2>Communication & after-care</h2>
          </div>
          <p className="form-note">
            <CircleAlert size={16} />
            Preferences create drafts and local reminders. SMS, customer email, push delivery and
            automated scheduling are not connected.
          </p>
          {PREFERENCE_OPTIONS.map((option) => (
            <div key={option.key} className="preference-row">
              <span className="preference-icon">
                <option.icon size={18} />
              </span>
              <div>
                <strong>{option.title}</strong>
                <p>{option.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.preferences[option.key]}
                aria-label={option.title}
                className={`switch-control ${state.preferences[option.key] ? "on" : ""}`}
                onClick={() => togglePreference(option.key)}
              >
                <span />
              </button>
            </div>
          ))}
        </section>
        <aside>
          <section className="settings-panel offline-settings">
            <div className="settings-heading">
              <WifiOff size={18} />
              <h2>Ready for the road</h2>
            </div>
            <p className="quiet-copy">
              Opt in to cache key dates and published PDFs on this device for 24 hours. Other people
              using this device may access the cache. Only enable this on a trusted device.
            </p>
            <button
              className="button secondary"
              disabled={savingOffline}
              onClick={saveForOffline}
            >
              <Download size={14} />
              {savingOffline ? "Saving…" : hasOfflineCopy ? "Refresh offline copy" : "Save for offline"}
            </button>
            {hasOfflineCopy && (
              <button
                className="text-button text-danger"
                onClick={() =>
                  clearOfflineData().then(() => {
                    setHasOfflineCopy(false);
                    toast.success("Offline cache cleared.");
                  })
                }
              >
                Clear this device’s offline copy
              </button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
