/**
 * ELI5: The "My team" tab where the client chats with their coordinator.
 * What: Coordinator card, non-internal message thread, and compose box.
 * Owns: Conversation tab markup + draft text state.
 * Depends on: Primitives (Avatar, Badge, PageHeading), HubContext (addMessage), parent passes transaction + milestones.
 */
import { useState } from "react";
import { Send } from "lucide-react";
import { useHub } from "@/contexts/HubContext";
import { CLIENT_MESSAGE_MAX_LENGTH } from "./clientJourneyConstants";
import { Avatar, Badge, PageHeading } from "./Primitives";
import type { ContractDeadline, Message, Transaction } from "@/lib/types";

export interface ClientTeamProps {
  transaction: Transaction;
  messages: Message[];
  milestones: ContractDeadline[];
}

export function ClientTeam({ transaction, messages, milestones }: ClientTeamProps) {
  const { addMessage } = useHub();
  const [draft, setDraft] = useState("");

  async function sendMessage(): Promise<void> {
    if (!draft.trim()) return;
    await addMessage(transaction.id, draft.trim());
    setDraft("");
  }

  return (
    <>
      <PageHeading
        title="Your team is right here."
        description="No question is too small. Let’s keep moving together."
      />
      <div className="client-team">
        <Avatar name={transaction.owner} />
        <div>
          <h3>{transaction.owner}</h3>
          <p>Your Flores Property Group transaction coordinator</p>
        </div>
        <Badge color="sage">Here to help</Badge>
      </div>
      <div className="client-conversation message-thread">
        {messages.map((message) => (
          <div className="chat-message" key={message.id}>
            <Avatar name={message.sender} small />
            <div>
              <strong>{message.sender}</strong>
              <p>{message.text}</p>
              <small>
                {message.milestoneId
                  ? milestones.find((milestone) => milestone.id === message.milestoneId)?.label
                  : "General check-in"}
              </small>
            </div>
          </div>
        ))}
        {!messages.length && (
          <p className="quiet-copy">Ask a question or send your team an update below.</p>
        )}
      </div>
      <div className="message-compose">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={CLIENT_MESSAGE_MAX_LENGTH}
          placeholder="What’s on your mind?"
        />
        <div>
          <span className="quiet-copy">Your transaction team can see this message.</span>
          <button className="button primary small" disabled={!draft.trim()} onClick={sendMessage}>
            <Send size={14} />
            Send message
          </button>
        </div>
      </div>
    </>
  );
}
