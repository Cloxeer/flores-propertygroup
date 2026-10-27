/**
 * ELI5: The shapes of all the things the hub remembers (deals, tasks, files, messages).
 * What: Domain model for the Flores Property Group hub state persisted in localStorage.
 * Owns: TypeScript types only (no runtime code).
 * Depends on: nothing.
 */

export type StageId =
  | "under-contract"
  | "inspection"
  | "financing"
  | "closing"
  | "closed";

export type BadgeColor = "clay" | "gold" | "blue" | "sage" | "danger";

export interface PipelineStage {
  id: StageId;
  label: string;
  color: BadgeColor;
}

export type ClientType = "Buyer" | "Seller";

export type MilestoneId =
  | "earnest"
  | "documents"
  | "inspection"
  | "resolution"
  | "title"
  | "repairs"
  | "walkthrough"
  | "settlement";

export type DayAnchor = "acceptance" | "independentConsideration";
export type EarnestAnchor = "acceptance" | "inspection" | "resolution";

/** Contract terms; day counts + anchors or specific ISO (YYYY-MM-DD) dates. */
export interface TransactionTerms {
  acceptance?: string;
  settlement?: string;
  independentConsideration?: string;
  inspectionDate?: string;
  documentsDate?: string;
  resolutionDate?: string;
  titleReceipt?: string;
  earnestDate?: string;
  walkThroughDate?: string;
  holidayOverrides?: string[];
  earnestDays?: number;
  inspectionDays?: number;
  resolutionDays?: number;
  documentsDays?: number;
  titleDays?: number;
  walkThroughDays?: number;
  repairDays?: number;
  inspectionAnchor?: DayAnchor;
  documentsAnchor?: DayAnchor;
  earnestAnchor?: EarnestAnchor;
}

export interface Transaction {
  id: string;
  address: string;
  city: string;
  client: string;
  clientType: ClientType;
  price: number;
  stage: StageId;
  owner: string;
  image: string;
  createdAt: string;
  terms: TransactionTerms;
  completedMilestones: string[];
  inspector?: string;
  inspectionStatus?: string;
}

export interface Task {
  id: string;
  transactionId: string;
  title: string;
  /** ISO date YYYY-MM-DD */
  due: string;
  owner: string;
  complete: boolean;
  critical: boolean;
  public: boolean;
  milestoneId?: string;
}

export interface HubDocument {
  id: string;
  transactionId: string;
  name: string;
  kind: string;
  milestoneId: string;
  finalized: boolean;
  published: boolean;
  createdAt: string;
  /** data: URL of the PDF */
  data: string;
  size: number;
}

export interface Message {
  id: string;
  transactionId: string;
  sender: string;
  text: string;
  createdAt: string;
  internal: boolean;
  milestoneId?: string;
}

export interface Activity {
  id: string;
  text: string;
  createdAt: string;
  transactionId?: string;
}

export type DraftChannel = "SMS" | "Email";

export interface Draft {
  id: string;
  transactionId: string;
  channel: DraftChannel;
  recipient: string;
  text: string;
  status: string;
}

export interface Preferences {
  criticalSMS: boolean;
  inApp: boolean;
  phaseEmail: boolean;
  seasonalCare: boolean;
  taxReminder: boolean;
  exemptionReminder: boolean;
}

export type PreferenceKey = keyof Preferences;

export interface HubState {
  transactions: Transaction[];
  tasks: Task[];
  documents: HubDocument[];
  messages: Message[];
  activity: Activity[];
  drafts: Draft[];
  preferences: Preferences;
}

/** One computed contract deadline (original `Wa` result). */
export interface ContractDeadline {
  id: string;
  label: string;
  date: string | null;
  source: string;
  note: string;
}

export interface HolidayCalendar {
  overrides: Set<string>;
  isHoliday: (isoDate: string) => boolean;
}

/** Offline snapshot persisted under `flores-offline-snapshot`. */
export interface OfflineSnapshot {
  state: HubState;
  scope: string;
  expires: number;
}
