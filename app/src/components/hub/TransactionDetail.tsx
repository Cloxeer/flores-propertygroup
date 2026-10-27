/**
 * ELI5: The big pop-up for one home deal, with its roadmap, checklist and chat.
 * What: TransactionDetail dialog (bD) — tracker-first roadmap, milestone completion, stage select, team tasks,
 *       milestone-scoped conversation, edit-details form and client-invite dialog.
 * Owns: Detail dialog UI + its local tab/compose/invite state and milestone/stage mutations.
 * Depends on: HubContext, Primitives, TransactionFormDialog, lib/contract, lib/dates, lib/constants.
 */
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Copy, Link, LockKeyhole, Pencil, Send } from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { Avatar, Badge, HubDialog, TaskRow } from "@/components/hub/Primitives";
import { MilestoneTracker } from "@/components/hub/MilestoneTracker";
import { TransactionFormDialog } from "@/components/hub/TransactionForm";
import { calculateContractDeadlines } from "@/lib/contract";
import { formatDate } from "@/lib/dates";
import { FALLBACK_HOME_IMAGE, PIPELINE_STAGES } from "@/lib/constants";
import type { StageId, Transaction } from "@/lib/types";
import { newId } from "@/lib/utils";

type DetailTab = "roadmap" | "tasks" | "conversation";

const SETTLEMENT_MILESTONE_ID = "settlement";
const CLIENT_PIN_LENGTH = 4;
const MESSAGE_MAX_LENGTH = 2000;
const PRIVATE_INVITE_UNAVAILABLE = "Client invitations are not available in this build.";

interface TransactionDetailProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  const { state, update, demo, addMessage } = useHub();
  const [tab, setTab] = useState<DetailTab>("roadmap");
  const [editing, setEditing] = useState(false);
  const [threadMilestoneId, setThreadMilestoneId] = useState<string | undefined>();
  const [draftMessage, setDraftMessage] = useState("");
  const [teamOnly, setTeamOnly] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [pin, setPin] = useState("");
  const [shareLink] = useState("");
  const [invitePending, setInvitePending] = useState(false);

  const current = state.transactions.find((item) => item.id === transaction.id) || transaction;
  const deadlines = calculateContractDeadlines(current.terms);
  const transactionTasks = state.tasks.filter((task) => task.transactionId === current.id);
  const threadMessages = state.messages.filter(
    (message) => message.transactionId === current.id && message.milestoneId === threadMilestoneId,
  );

  async function toggleMilestone(milestoneId: string) {
    await update((draft) => {
      const target = draft.transactions.find((item) => item.id === current.id);
      if (!target) return;
      const wasComplete = target.completedMilestones.includes(milestoneId);
      target.completedMilestones = wasComplete
        ? target.completedMilestones.filter((id) => id !== milestoneId)
        : [...target.completedMilestones, milestoneId];
      if (milestoneId === SETTLEMENT_MILESTONE_ID) {
        target.stage = wasComplete ? "closing" : "closed";
      }
      draft.tasks
        .filter((task) => task.id.startsWith(`contract-${current.id}-`) && task.milestoneId === milestoneId)
        .forEach((task) => {
          task.complete = !wasComplete;
        });
      draft.documents
        .filter(
          (document) =>
            document.transactionId === current.id && document.milestoneId === milestoneId && document.finalized,
        )
        .forEach((document) => {
          document.published = !wasComplete;
        });
      draft.activity.unshift({
        id: newId(),
        transactionId: current.id,
        text: `${deadlines.find((deadline) => deadline.id === milestoneId)?.label} ${wasComplete ? "reopened" : "completed"} for ${current.client}.`,
        createdAt: new Date().toISOString(),
      });
      if (!wasComplete && draft.preferences.phaseEmail) {
        draft.drafts.push({
          id: newId(),
          transactionId: current.id,
          channel: "Email",
          recipient: current.client,
          status: "draft",
          text: `Hi ${current.client}, ${deadlines.find((deadline) => deadline.id === milestoneId)?.label} is complete for ${current.address}. You can view your next step in your Flores home journey.`,
        });
      }
    });
  }

  function changeStage(stage: StageId) {
    update((draft) => {
      const target = draft.transactions.find((item) => item.id === current.id);
      if (!target) return;
      target.stage = stage;
      if (stage === "closed" && !target.completedMilestones.includes(SETTLEMENT_MILESTONE_ID)) {
        target.completedMilestones.push(SETTLEMENT_MILESTONE_ID);
      }
      draft.documents
        .filter(
          (document) =>
            document.transactionId === current.id &&
            document.milestoneId === SETTLEMENT_MILESTONE_ID &&
            document.finalized,
        )
        .forEach((document) => {
          document.published = target.completedMilestones.includes(SETTLEMENT_MILESTONE_ID);
        });
    });
  }

  async function createInviteLink() {
    if (demo) {
      toast.info("Switch to your private workspace to create a real, PIN-protected client link.");
      return;
    }
    setInvitePending(true);
    try {
      // The original called the hub.invite tRPC mutation; that backend is not part of this build.
      throw new Error(PRIVATE_INVITE_UNAVAILABLE);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : PRIVATE_INVITE_UNAVAILABLE);
    } finally {
      setInvitePending(false);
    }
  }

  async function sendMessage() {
    if (draftMessage.trim()) {
      await addMessage(current.id, draftMessage.trim(), threadMilestoneId, teamOnly);
      setDraftMessage("");
    }
  }

  function openThread(milestoneId: string | undefined) {
    setThreadMilestoneId(milestoneId);
    setTab("conversation");
  }

  return (
    <>
      <HubDialog
        open
        onClose={onClose}
        title={current.address}
        description={`${current.city} · ${current.client}`}
        wide
      >
        <div className="detail-summary">
          <img src={current.image || FALLBACK_HOME_IMAGE} alt="Illustrative property exterior" loading="lazy" decoding="async" />
          <div>
            <Badge color="clay">{current.clientType} journey</Badge>
            <h3>${current.price.toLocaleString()}</h3>
            <span>
              <CalendarDays size={13} />
              Signing {formatDate(current.terms.settlement ?? null)}
            </span>
            <span>
              <Avatar name={current.owner} small />
              {current.owner} · Transaction coordinator
            </span>
          </div>
          <div className="detail-actions">
            <button className="button secondary small" onClick={() => setEditing(true)}>
              <Pencil size={13} />
              Edit details
            </button>
            <button className="button secondary small" onClick={() => setInviting(true)}>
              <Link size={13} />
              Invite client
            </button>
          </div>
        </div>
        <div className="detail-stage">
          <label>Pipeline stage</label>
          <select value={current.stage} onChange={(event) => changeStage(event.target.value as StageId)}>
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
        <div className="tabs">
          <button className={tab === "roadmap" ? "active" : ""} onClick={() => setTab("roadmap")}>
            Roadmap
          </button>
          <button className={tab === "tasks" ? "active" : ""} onClick={() => setTab("tasks")}>
            Team checklist <span>{transactionTasks.filter((task) => !task.complete).length}</span>
          </button>
          <button className={tab === "conversation" ? "active" : ""} onClick={() => setTab("conversation")}>
            Conversation
          </button>
        </div>
        {tab === "roadmap" && (
          <MilestoneTracker
            deadlines={deadlines}
            completedIds={current.completedMilestones}
            settlement={current.terms.settlement}
            onToggle={toggleMilestone}
            onDiscuss={openThread}
          />
        )}
        {tab === "tasks" && (
          <div>
            <div className="form-note">
              <LockKeyhole size={15} />
              Internal compliance tasks are not shown in the client roadmap.
            </div>
            {transactionTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                address={current.address}
                onOpen={() => openThread(task.milestoneId)}
                onToggle={() =>
                  update((draft) => {
                    const target = draft.tasks.find((item) => item.id === task.id);
                    if (target) target.complete = !target.complete;
                  })
                }
              />
            ))}
          </div>
        )}
        {tab === "conversation" && (
          <>
            <label className="thread-select">
              Conversation
              <select
                value={threadMilestoneId || ""}
                onChange={(event) => setThreadMilestoneId(event.target.value || undefined)}
              >
                <option value="">General check-in</option>
                {deadlines.map((deadline) => (
                  <option key={deadline.id} value={deadline.id}>
                    {deadline.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="message-thread">
              {threadMessages.length === 0 && (
                <p className="quiet-copy">
                  A good place to keep everyone on the same page. Start the conversation below.
                </p>
              )}
              {threadMessages.map((message) => (
                <div key={message.id} className="chat-message">
                  <Avatar name={message.sender} small />
                  <div>
                    <strong>{message.sender}</strong>
                    {message.internal && <Badge color="gold">Team only</Badge>}
                    <p>{message.text}</p>
                    <small>
                      {new Date(message.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <div className="message-compose">
              <textarea
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder="A question, an update, a little reassurance…"
                maxLength={MESSAGE_MAX_LENGTH}
              />
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={teamOnly}
                    onChange={(event) => setTeamOnly(event.target.checked)}
                  />
                  Team-only note
                </label>
                <button className="button primary small" onClick={sendMessage} disabled={!draftMessage.trim()}>
                  <Send size={14} />
                  Send message
                </button>
              </div>
            </div>
          </>
        )}
      </HubDialog>
      {editing && <TransactionFormDialog open onClose={() => setEditing(false)} existing={current} />}
      {inviting && (
        <HubDialog
          open
          onClose={() => setInviting(false)}
          title="A simple way to keep your client in the loop."
          description="A scoped link, a four-digit PIN, and their own home journey."
        >
          <div className="form-note">
            <LockKeyhole size={17} />
            <span>
              Links expire after 7 days. Five incorrect PIN attempts lock the invitation. Share the PIN
              separately from the link.
            </span>
          </div>
          <label className="form-label">
            Set a 4-digit client PIN
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, CLIENT_PIN_LENGTH))}
              inputMode="numeric"
              type="password"
              maxLength={CLIENT_PIN_LENGTH}
              placeholder="••••"
            />
          </label>
          <button
            className="button primary"
            disabled={pin.length !== CLIENT_PIN_LENGTH || invitePending}
            onClick={createInviteLink}
          >
            <Link size={15} />
            {invitePending ? "Creating…" : "Create secure link"}
          </button>
          {shareLink && (
            <div className="share-link">
              <input readOnly value={shareLink} />
              <button
                className="button secondary small"
                onClick={() =>
                  navigator.clipboard.writeText(shareLink).then(() => toast.success("Client link copied."))
                }
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
          )}
          <p className="quiet-copy">
            SMS delivery is not connected. You can copy and share this link manually; creating it does not
            send a message.
          </p>
        </HubDialog>
      )}
    </>
  );
}
