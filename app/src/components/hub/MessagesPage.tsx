import { useState } from "react";
import { ChevronRight, CircleAlert, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { useHub } from "@/contexts/HubContext";
import { calculateContractDeadlines } from "@/lib/contract";
import { Avatar, Badge, EmptyState, PageHeading } from "@/components/hub/Primitives";

type MessagesTab = "conversations" | "drafts";

/** Messages route (/messages): conversation threads per transaction + outbox drafts (orig wD). */
export function MessagesPage() {
  const { state, addMessage } = useHub();
  const [transactionId, setTransactionId] = useState(state.transactions[0]?.id || "");
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [tab, setTab] = useState<MessagesTab>("conversations");
  const [milestoneId, setMilestoneId] = useState("");

  const transaction = state.transactions.find((item) => item.id === transactionId);
  const thread = state.messages.filter(
    (message) =>
      message.transactionId === transactionId &&
      (milestoneId ? message.milestoneId === milestoneId : !message.milestoneId),
  );

  async function send() {
    if (text.trim()) {
      await addMessage(transactionId, text.trim(), milestoneId || undefined, internal);
      setText("");
    }
  }

  return (
    <>
      <PageHeading
        title="Good communication feels like home."
        description="Keep the right conversations close to the right next steps."
      />
      <div className="tabs">
        <button
          className={tab === "conversations" ? "active" : ""}
          onClick={() => setTab("conversations")}
        >
          Conversations
        </button>
        <button className={tab === "drafts" ? "active" : ""} onClick={() => setTab("drafts")}>
          Outbox drafts <span>{state.drafts.length}</span>
        </button>
      </div>
      {tab === "drafts" ? (
        <div className="drafts-list">
          <div className="form-note">
            <CircleAlert size={16} />
            <span>
              These are drafts, not sent messages. SMS and customer email providers are not
              connected.
            </span>
          </div>
          {state.drafts.map((draft) => (
            <article key={draft.id} className="draft-card">
              <div>
                <Badge color={draft.channel === "SMS" ? "clay" : "blue"}>
                  {draft.channel} draft
                </Badge>
                <strong>To: {draft.recipient}</strong>
              </div>
              <p>{draft.text}</p>
              <button
                className="button secondary small"
                onClick={() =>
                  navigator.clipboard.writeText(draft.text).then(() => toast.success("Draft copied."))
                }
              >
                <Copy size={13} />
                Copy draft
              </button>
            </article>
          ))}
          {state.drafts.length === 0 && (
            <EmptyState
              title="Your outbox is taking a breather."
              description="Inspector selections and completed milestones will prepare new drafts here."
            />
          )}
        </div>
      ) : (
        <div className="messages-layout">
          <aside className="conversation-list">
            {state.transactions.map((item) => (
              <button
                key={item.id}
                className={transactionId === item.id ? "active" : ""}
                onClick={() => {
                  setTransactionId(item.id);
                  setMilestoneId("");
                }}
              >
                <Avatar name={item.client} small />
                <span>
                  <strong>{item.client}</strong>
                  <small>{item.address}</small>
                </span>
                <ChevronRight size={13} />
              </button>
            ))}
          </aside>
          <section className="conversation-panel">
            {transaction ? (
              <>
                <div className="conversation-header">
                  <div>
                    <h3>{transaction.client}</h3>
                    <span>{transaction.address}</span>
                  </div>
                  <select
                    aria-label="Conversation milestone"
                    value={milestoneId}
                    onChange={(event) => setMilestoneId(event.target.value)}
                  >
                    <option value="">General check-in</option>
                    {calculateContractDeadlines(transaction.terms).map((deadline) => (
                      <option key={deadline.id} value={deadline.id}>
                        {deadline.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="message-thread">
                  {thread.map((message) => (
                    <div key={message.id} className="chat-message">
                      <Avatar name={message.sender} small />
                      <div>
                        <strong>{message.sender}</strong>
                        {message.internal && <Badge color="gold">Team only</Badge>}
                        <p>{message.text}</p>
                        <small>
                          {new Date(message.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </small>
                      </div>
                    </div>
                  ))}
                  {thread.length === 0 && (
                    <EmptyState
                      title="A fresh conversation."
                      description="Ask a question, share an update, or offer a little reassurance."
                    />
                  )}
                </div>
                <div className="message-compose">
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    maxLength={2000}
                    placeholder="What would you like to share?"
                  />
                  <div>
                    <label>
                      <input
                        checked={internal}
                        type="checkbox"
                        onChange={(event) => setInternal(event.target.checked)}
                      />
                      Team-only note
                    </label>
                    <button
                      className="button primary small"
                      disabled={!text.trim()}
                      onClick={send}
                    >
                      <Send size={13} />
                      Send message
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Let’s start a journey first."
                description="Create a transaction to bring your client conversations together."
              />
            )}
          </section>
        </div>
      )}
    </>
  );
}
