/**
 * ELI5: Where Anela backs up, restores or wipes her private workspace — all kept on her own device.
 * What: Settings panel with Download backup, Restore from file, Erase (with a confirm step); demo mode explains the switch.
 * Owns: Backup/restore/erase UI and its toasts.
 * Depends on: HubContext, lib/backup, sonner.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, HardDrive, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { daysSinceBackup, downloadBackup, parseBackupFile } from "@/lib/backup";

function describeLastBackup(days: number | null): string {
  if (days === null) return "No backup yet";
  if (days === 0) return "Last backup: today";
  return `Last backup: ${days} day${days === 1 ? "" : "s"} ago`;
}

export function DataSafetyPanel() {
  const { state, demo, setDemo, restoreWorkspace, eraseWorkspace } = useHub();
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [, setBackupTick] = useState(0);

  if (demo) {
    return (
      <section className="settings-panel data-safety">
        <div className="settings-heading">
          <ShieldCheck size={20} />
          <h2>Your data</h2>
        </div>
        <p className="quiet-copy">
          You’re in the sample workspace, so every name here is made up. Switch to your private workspace to add real
          clients. It stays on this device, and you control the backups.
        </p>
        <button className="button primary" onClick={() => setDemo(false)}>
          Open my private workspace
        </button>
      </section>
    );
  }

  async function restoreFromFile(file: File | undefined) {
    if (!file) return;
    try {
      restoreWorkspace(parseBackupFile(await file.text()));
      toast.success("Backup restored.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That backup could not be read.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <section className="settings-panel data-safety">
      <div className="settings-heading">
        <HardDrive size={20} />
        <h2>Your data</h2>
      </div>
      <p className="quiet-copy">
        Your private workspace lives only on this device. Keep real details light: names, streets and dates are fine;
        please don’t enter loan numbers, SSNs or bank details. Download a backup now and then.
      </p>
      <p className="data-safety-status">{describeLastBackup(daysSinceBackup())}</p>
      <div className="data-safety-actions">
        <button
          className="button primary"
          onClick={() => {
            downloadBackup(state);
            setBackupTick((tick) => tick + 1);
            toast.success("Backup downloaded. Keep it somewhere safe.");
          }}
        >
          <Download size={16} />
          Download backup
        </button>
        <button className="button secondary" onClick={() => fileInput.current?.click()}>
          <Upload size={16} />
          Restore from backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => restoreFromFile(event.target.files?.[0])}
        />
      </div>
      <button className="text-button" onClick={() => setDemo(true)}>
        Explore the sample workspace
      </button>
      {confirmingErase ? (
        <div className="form-note">
          <Trash2 size={16} />
          <span>
            This removes every client, task and message from this device. Download a backup first if you might need them.
          </span>
          <button
            className="button secondary"
            onClick={() => {
              eraseWorkspace();
              setConfirmingErase(false);
              toast.success("Private workspace erased on this device.");
            }}
          >
            Yes, erase everything
          </button>
          <button className="text-button" onClick={() => setConfirmingErase(false)}>
            Keep my data
          </button>
        </div>
      ) : (
        <button className="text-button text-danger" onClick={() => setConfirmingErase(true)}>
          Erase this device’s data
        </button>
      )}
    </section>
  );
}
