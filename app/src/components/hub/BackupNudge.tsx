/**
 * ELI5: A gentle one-tap reminder to back up real client data before something happens to the phone.
 * What: Card shown on Today in the private workspace when data exists and the last backup is missing or old.
 * Owns: Backup reminder card.
 * Depends on: lib/backup, sonner.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { backupIsDue, downloadBackup } from "@/lib/backup";
import type { HubState } from "@/lib/types";

export interface BackupNudgeProps {
  state: HubState;
}

export function BackupNudge({ state }: BackupNudgeProps) {
  const [done, setDone] = useState(false);
  if (done || !backupIsDue(state.transactions.length)) {
    return null;
  }
  return (
    <section className="backup-nudge">
      <div>
        <strong>Back up your workspace</strong>
        <span>Your clients are saved on this device only. One tap keeps a safe copy.</span>
      </div>
      <button
        className="button primary"
        onClick={() => {
          downloadBackup(state);
          setDone(true);
          toast.success("Backup downloaded. Keep it somewhere safe.");
        }}
      >
        <Download size={16} />
        Download backup
      </button>
    </section>
  );
}
