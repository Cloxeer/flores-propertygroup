/**
 * ELI5: The private link page — a client types their 4-digit PIN to open their journey.
 * What: PIN gate + offline-snapshot fallback that wraps ClientJourney in a client-only HubProvider.
 * Owns: PIN entry state, online/offline tracking, the portal header and PIN card markup.
 * Depends on: HubContext (HubProvider), ClientJourney, offline snapshots, Primitives (Badge).
 * Note: the original called a tRPC portal API (me / access). The backend is not part of this build,
 * so the "me" query never returns data and a PIN submit reports the portal as unavailable.
 */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { HubProvider } from "@/contexts/HubContext";
import { loadOfflineSnapshot } from "@/lib/offline";
import { Badge } from "./Primitives";
import { ClientJourney } from "./ClientJourney";
import {
  CLIENT_LOGO_SRC,
  CLIENT_PORTAL_SCOPE_PREFIX,
  CLIENT_PORTAL_TOKEN_SCOPE_LENGTH,
  PIN_LENGTH,
} from "./clientJourneyConstants";

const PORTAL_UNAVAILABLE_MESSAGE = "The client portal service is not available in this build.";

export interface ClientPortalProps {
  token: string;
}

export function ClientPortal({ token }: ClientPortalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const scope = CLIENT_PORTAL_SCOPE_PREFIX + token.slice(0, CLIENT_PORTAL_TOKEN_SCOPE_LENGTH);
  const offlineState = online ? null : loadOfflineSnapshot(scope);

  useEffect(() => {
    const syncOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  function submitPin(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(PORTAL_UNAVAILABLE_MESSAGE);
  }

  if (offlineState) {
    return (
      <div className="portal-root">
        <div className="portal-header">
          <img src={CLIENT_LOGO_SRC} alt="Flores Property Group" />
          <span>YOUR HOME JOURNEY</span>
          <Badge color={online ? "sage" : "gold"}>
            {online ? "Private client workspace" : "Offline · read only"}
          </Badge>
        </div>
        <HubProvider
          clientState={offlineState}
          clientTransactionId={offlineState.transactions[0]?.id}
          onClientRefresh={() => undefined}
        >
          <ClientJourney
            external
            transactionId={offlineState.transactions[0]?.id}
            offlineScope={scope}
          />
        </HubProvider>
      </div>
    );
  }

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <img src={CLIENT_LOGO_SRC} alt="Flores Property Group" />
        <span className="eyebrow">YOUR JOURNEY, YOUR SPACE</span>
        <h1>A little closer to home.</h1>
        <p>Enter the four-digit PIN your team shared with you to open your private home journey.</p>
        <form onSubmit={submitPin}>
          <label htmlFor="client-pin">Your 4-digit PIN</label>
          <input
            id="client-pin"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={PIN_LENGTH}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            required
          />
          {error && (
            <div className="pin-error" role="alert">
              {error}
            </div>
          )}
          <button className="button primary" disabled={pin.length !== PIN_LENGTH}>
            Open my journey
            <ArrowRight size={15} />
          </button>
        </form>
        <span className="pin-security">
          <LockKeyhole size={13} />A private, expiring link. No password to remember.
        </span>
      </div>
    </div>
  );
}
