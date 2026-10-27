/**
 * ELI5: The hub's shared brain: holds all deals/tasks/messages and lets any page change them safely.
 * What: HubProvider + useHub (state, update, demo/private mode, inspector + message actions, restore/erase)
 *       and useIsMobile. Local-first: the demo workspace persists to `flores-demo-v1` (seeded) and the
 *       private workspace to `flores-private-v1` (starts empty). Both live only on this device.
 *       Server auth/sync from the original is dropped: the user is always signed out.
 * Owns: hub state lifecycle and persistence.
 * Depends on: lib/constants, lib/seed, lib/offline, lib/dates, lib/utils, lib/types, sonner.
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  DEMO_STORAGE_KEY,
  LEGACY_HOME_IMAGES,
  EMPTY_HUB_STATE,
  MOBILE_MEDIA_QUERY,
  OFFICE_TIME_ZONE,
  PRIVATE_STORAGE_KEY,
  WORKSPACE_MODE_STORAGE_KEY,
} from "@/lib/constants";
import { clearBackupClock } from "@/lib/backup";
import { createSeedState } from "@/lib/seed";
import type { HubState, Transaction } from "@/lib/types";
import { newId } from "@/lib/utils";

/** Shown if something asks for a sign-in: this build has no accounts yet (local-first). */
const LOGIN_NOT_CONFIGURED = "Sign-in is not set up yet. Your private workspace is saved on this device.";
const DEFAULT_USER_NAME = "Anela";
const INSPECTION_TASK_OWNER = "Gabriella";

/** Action a client-portal host may handle (original tRPC `portal.action`). */
export type PortalAction =
  | { type: "selectInspector"; inspector: string }
  | { type: "message"; text: string; milestoneId?: string };

export type HubMutator = (draft: HubState) => void;

export interface HubContextValue {
  state: HubState;
  /** Clone state, apply `mutator`, persist on this device. Toasts when blocked (client portal view). */
  update: (mutator: HubMutator) => Promise<void>;
  /** True in the demo workspace (always true for client portal view = false). */
  demo: boolean;
  setDemo: (demo: boolean) => void;
  loading: boolean;
  saving: boolean;
  userName: string;
  isAuthenticated: boolean;
  signIn: () => void;
  /** Replace the private workspace with a validated backup. */
  restoreWorkspace: (next: HubState) => void;
  /** Wipe the private workspace on this device. */
  eraseWorkspace: () => void;
  clientOnly: boolean;
  offlineScope: string | null;
  selectInspector: (transaction: Transaction, inspector: string) => Promise<void>;
  addMessage: (
    transactionId: string,
    text: string,
    milestoneId?: string,
    internal?: boolean,
  ) => Promise<void>;
}

const HubContext = createContext<HubContextValue | null>(null);

function loadPrivateState(): HubState {
  try {
    const saved = localStorage.getItem(PRIVATE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as HubState;
    }
  } catch {
    // fall through to an empty workspace
  }
  return structuredClone(EMPTY_HUB_STATE);
}

function loadDemoState(): HubState {
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as HubState;
      for (const transaction of state.transactions) {
        transaction.image = LEGACY_HOME_IMAGES[transaction.image] ?? transaction.image;
      }
      return state;
    }
  } catch {
    // fall through to seed data
  }
  return createSeedState();
}

interface HubProviderProps {
  children: ReactNode;
  /** Client-portal read-only state (when set, all edits go through onPortalAction). */
  clientState?: HubState;
  clientTransactionId?: string;
  onClientRefresh?: () => void;
  onPortalAction?: (action: PortalAction) => Promise<void>;
}

export function HubProvider({
  children,
  clientState,
  clientTransactionId,
  onClientRefresh,
  onPortalAction,
}: HubProviderProps) {
  const [demoMode, setDemoMode] = useState<boolean>(
    () => localStorage.getItem(WORKSPACE_MODE_STORAGE_KEY) !== "private",
  );
  const [demoState, setDemoState] = useState<HubState>(loadDemoState);
  const [privateState, setPrivateState] = useState<HubState>(loadPrivateState);
  const isAuthenticated = false;
  const offlineScope = demoMode ? "demo" : "private";
  /** Server saves are dropped, so nothing is ever "saving". */
  const saving = false;
  const savingRef = useRef(false);

  const currentState: HubState = clientState ?? (demoMode ? demoState : privateState);
  const stateRef = useRef<HubState>(currentState);
  stateRef.current = currentState;

  useEffect(() => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoState));
    } catch {
      toast.error(
        "This device’s local storage is full. Use a smaller PDF or a private workspace.",
      );
    }
  }, [demoState]);

  useEffect(() => {
    try {
      localStorage.setItem(PRIVATE_STORAGE_KEY, JSON.stringify(privateState));
    } catch {
      toast.error("This device’s storage is full. Download a backup, then remove large PDFs.");
    }
  }, [privateState]);

  function signIn(): void {
    toast.error(LOGIN_NOT_CONFIGURED);
  }

  function restoreWorkspace(next: HubState): void {
    setPrivateState(next);
    stateRef.current = next;
    setDemoMode(false);
    localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "private");
  }

  function eraseWorkspace(): void {
    const empty = structuredClone(EMPTY_HUB_STATE);
    setPrivateState(empty);
    stateRef.current = empty;
    clearBackupClock();
  }

  function setDemo(demo: boolean): void {
    localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, demo ? "demo" : "private");
    setDemoMode(demo);
  }

  async function update(mutator: HubMutator): Promise<void> {
    if (clientState) {
      toast.error("This action is available to your brokerage team.");
      return;
    }
    if (savingRef.current) {
      toast.info("Saving your previous change. Please try again in a moment.");
      return;
    }
    const next = structuredClone(stateRef.current);
    mutator(next);
    if (demoMode) {
      setDemoState(next);
    } else {
      setPrivateState(next);
    }
    stateRef.current = next;
  }

  async function runPortalAction(action: PortalAction, successMessage: string): Promise<void> {
    try {
      if (!onPortalAction) {
        throw new Error("This action is available to your brokerage team.");
      }
      await onPortalAction(action);
      onClientRefresh?.();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  async function selectInspector(transaction: Transaction, inspector: string): Promise<void> {
    if (clientState) {
      await runPortalAction(
        { type: "selectInspector", inspector },
        "Your selection is with Gabriella. She’ll coordinate the next step.",
      );
      return;
    }
    await update((draft) => {
      const target = draft.transactions.find((item) => item.id === transaction.id);
      if (!target || target.inspector === inspector) {
        return;
      }
      target.inspector = inspector;
      target.inspectionStatus = "Pending inspection";
      target.stage = "inspection";
      draft.tasks.push({
        id: newId(),
        transactionId: transaction.id,
        title: `Schedule inspection with ${inspector}`,
        due: new Date().toLocaleDateString("en-CA", { timeZone: OFFICE_TIME_ZONE }),
        owner: INSPECTION_TASK_OWNER,
        complete: false,
        critical: false,
        public: false,
        milestoneId: "inspection",
      });
      draft.drafts.push({
        id: newId(),
        transactionId: transaction.id,
        channel: "SMS",
        recipient: inspector,
        text: `Hi ${inspector}, this is Gabriella with Flores Property Group. Our buyer would like to schedule an inspection at ${transaction.address}. Please let us know your availability. Thank you!`,
        status: "draft",
      });
      draft.activity.unshift({
        id: newId(),
        transactionId: transaction.id,
        text: `${transaction.client} selected ${inspector}. Gabriella has a new scheduling task.`,
        createdAt: new Date().toISOString(),
      });
    });
    toast.success("Inspector selected. Gabriella’s task and vendor SMS draft are ready.");
  }

  async function addMessage(
    transactionId: string,
    text: string,
    milestoneId?: string,
    internal = false,
  ): Promise<void> {
    if (clientState) {
      await runPortalAction(
        { type: "message", text, milestoneId },
        "Message added to your conversation.",
      );
      return;
    }
    await update((draft) => {
      draft.messages.push({
        id: newId(),
        transactionId,
        text,
        milestoneId,
        internal,
        sender: DEFAULT_USER_NAME,
        createdAt: new Date().toISOString(),
      });
    });
  }

  const value: HubContextValue = {
    state: currentState,
    update,
    demo: clientState ? false : demoMode,
    setDemo,
    loading: false,
    saving,
    userName: DEFAULT_USER_NAME,
    isAuthenticated,
    signIn,
    restoreWorkspace,
    eraseWorkspace,
    clientOnly: !!clientTransactionId,
    offlineScope,
    selectInspector,
    addMessage,
  };

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub(): HubContextValue {
  const context = useContext(HubContext);
  if (!context) {
    throw new Error("HubProvider is required");
  }
  return context;
}

/** True when the viewport is phone-sized (<= 760px); updates on resize (original `HT`). */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => window.matchMedia(MOBILE_MEDIA_QUERY).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => setIsMobile(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}
