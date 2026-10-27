/**
 * ELI5: Makes the pretend deals, tasks and files that fill the demo workspace on first visit.
 * What: Demo PDF data-URL builder and the fictional seed HubState generator (dates relative to today).
 * Owns: seed data only.
 * Depends on: constants.ts, dates.ts, types.ts.
 */
import { EMPTY_HUB_STATE, HOME_IMAGES } from "@/lib/constants";
import { shiftIsoDate, todayInDenver } from "@/lib/dates";
import type {
  ClientType,
  HubDocument,
  HubState,
  StageId,
  Task,
  Transaction,
} from "@/lib/types";

/** Builds a tiny valid one-page PDF as a data: URL (original `_b`). */
export function buildDemoPdf(subtitle: string): string {
  const lines = [
    "FLORES PROPERTY GROUP",
    "DEMONSTRATION DOCUMENT - NOT FOR SIGNATURE",
    subtitle,
    "This fictional sample contains no executed agreement.",
    "Replace with the finalized PDF for your transaction.",
    "No real client or financial information is included.",
  ];
  const content =
    "BT /F1 14 Tf 48 744 Td " +
    lines
      .map((line, index) => `${index ? "0 -34 Td " : ""}(${line.replace(/[()\\]/g, "")}) Tj`)
      .join(" ") +
    " ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return `data:application/pdf;base64,${btoa(pdf)}`;
}

interface SeedTransactionRow {
  id: string;
  address: string;
  client: string;
  clientType: ClientType;
  price: number;
  stage: StageId;
  owner: string;
  /** days from today to acceptance */
  acceptanceOffset: number;
  /** days from today to settlement */
  settlementOffset: number;
  imageIndex: number;
}

const SEED_TRANSACTIONS: SeedTransactionRow[] = [
  { id: "t1", address: "1842 Desert Willow Dr", client: "Elena & David Martinez", clientType: "Buyer", price: 425000, stage: "inspection", owner: "Gabriella", acceptanceOffset: -8, settlementOffset: 22, imageIndex: 0 },
  { id: "t2", address: "3065 Sonoma Springs Ave", client: "Michael Thompson", clientType: "Seller", price: 389000, stage: "under-contract", owner: "Anela", acceptanceOffset: -2, settlementOffset: 28, imageIndex: 1 },
  { id: "t3", address: "921 Mesilla Vista Ln", client: "Sofia & Daniel Reyes", clientType: "Buyer", price: 515000, stage: "financing", owner: "Gabriella", acceptanceOffset: -20, settlementOffset: 12, imageIndex: 2 },
  { id: "t4", address: "4708 Organ Mesa Loop", client: "Jennifer Williams", clientType: "Buyer", price: 469000, stage: "closing", owner: "Anela", acceptanceOffset: -28, settlementOffset: 4, imageIndex: 0 },
  { id: "t5", address: "1520 Camino del Sol", client: "Carlos & Ana Rivera", clientType: "Seller", price: 335000, stage: "under-contract", owner: "Gabriella", acceptanceOffset: -1, settlementOffset: 29, imageIndex: 2 },
  { id: "t6", address: "2841 Sagebrush Ridge", client: "Olivia Chen", clientType: "Buyer", price: 398000, stage: "inspection", owner: "Anela", acceptanceOffset: -7, settlementOffset: 23, imageIndex: 1 },
  { id: "t7", address: "630 Calle de la Luna", client: "James & Emma Wilson", clientType: "Seller", price: 575000, stage: "financing", owner: "Gabriella", acceptanceOffset: -17, settlementOffset: 13, imageIndex: 0 },
  { id: "t8", address: "3902 Copper Canyon Rd", client: "Andrew & Mia Garcia", clientType: "Buyer", price: 449000, stage: "closing", owner: "Anela", acceptanceOffset: -29, settlementOffset: 3, imageIndex: 1 },
  { id: "t9", address: "815 Paseo de la Tierra", client: "The Bennett family", clientType: "Buyer", price: 360000, stage: "closed", owner: "Anela", acceptanceOffset: -60, settlementOffset: -30, imageIndex: 2 },
];

const LATE_STAGES: StageId[] = ["financing", "closing", "closed"];

function buildSeedTransaction(row: SeedTransactionRow, today: string, nowIso: string): Transaction {
  const completedMilestones: string[] =
    row.stage === "under-contract" ? [] : ["earnest", "documents"];
  if (LATE_STAGES.includes(row.stage)) {
    completedMilestones.push("inspection", "resolution");
  }
  if (row.stage === "closing" || row.stage === "closed") {
    completedMilestones.push("title");
  }
  if (row.stage === "closed") {
    completedMilestones.push("repairs", "walkthrough", "settlement");
  }
  return {
    id: row.id,
    address: row.address,
    city: "Las Cruces, NM",
    client: row.client,
    clientType: row.clientType,
    price: row.price,
    stage: row.stage,
    owner: row.owner,
    image: HOME_IMAGES[row.imageIndex],
    createdAt: nowIso,
    terms: {
      acceptance: shiftIsoDate(today, row.acceptanceOffset),
      settlement: shiftIsoDate(today, row.settlementOffset),
      inspectionDate: shiftIsoDate(today, row.acceptanceOffset + 10),
      resolutionDays: 5,
      documentsDays: 5,
      documentsAnchor: "acceptance",
      inspectionAnchor: "acceptance",
      earnestDays: 3,
      earnestAnchor: "acceptance",
      titleReceipt: LATE_STAGES.includes(row.stage) ? shiftIsoDate(today, -4) : undefined,
    },
    completedMilestones,
  };
}

interface SeedTaskRow {
  id: string;
  transactionId: string;
  title: string;
  due: string;
  owner: string;
  critical: boolean;
  public: boolean;
  milestoneId: string;
}

function buildSeedTasks(today: string): Task[] {
  const rows: SeedTaskRow[] = [
    { id: "task1", transactionId: "t1", title: "Send inspection objection notice", due: today, owner: "Gabriella", critical: true, public: false, milestoneId: "inspection" },
    { id: "task2", transactionId: "t3", title: "Confirm final loan approval", due: today, owner: "Gabriella", critical: true, public: false, milestoneId: "title" },
    { id: "task3", transactionId: "t4", title: "Schedule the final walk-through", due: today, owner: "Anela", critical: false, public: true, milestoneId: "walkthrough" },
    { id: "task4", transactionId: "t2", title: "Confirm earnest money receipt", due: today, owner: "Gabriella", critical: false, public: false, milestoneId: "earnest" },
    { id: "task5", transactionId: "t6", title: "Choose your home inspector", due: today, owner: "Client", critical: false, public: true, milestoneId: "inspection" },
    { id: "task6", transactionId: "t8", title: "Review closing disclosure", due: today, owner: "Anela", critical: false, public: true, milestoneId: "settlement" },
    { id: "task7", transactionId: "t5", title: "Request seller disclosures", due: shiftIsoDate(today, 1), owner: "Gabriella", critical: false, public: false, milestoneId: "documents" },
    { id: "task8", transactionId: "t7", title: "Review the title commitment", due: shiftIsoDate(today, 2), owner: "Anela", critical: false, public: true, milestoneId: "title" },
  ];
  return rows.map((row) => ({ ...row, complete: false }));
}

function buildSeedDocuments(nowIso: string): HubDocument[] {
  return [
    {
      id: "doc1",
      transactionId: "t1",
      name: "Purchase agreement · Sample PDF",
      kind: "Purchase agreement",
      milestoneId: "earnest",
      finalized: true,
      published: true,
      createdAt: nowIso,
      data: buildDemoPdf("Purchase agreement - fictional summary"),
      size: 1300,
    },
    {
      id: "doc2",
      transactionId: "t9",
      name: "Settlement statement · Sample PDF",
      kind: "Settlement statement",
      milestoneId: "settlement",
      finalized: true,
      published: true,
      createdAt: nowIso,
      data: buildDemoPdf("Settlement statement - fictional summary"),
      size: 1300,
    },
  ];
}

/** Fresh demo workspace used when nothing is saved in localStorage (original `_T`). */
export function createSeedState(): HubState {
  const today = todayInDenver();
  const nowIso = new Date().toISOString();
  return {
    ...structuredClone(EMPTY_HUB_STATE),
    transactions: SEED_TRANSACTIONS.map((row) => buildSeedTransaction(row, today, nowIso)),
    tasks: buildSeedTasks(today),
    documents: buildSeedDocuments(nowIso),
    messages: [
      {
        id: "msg1",
        transactionId: "t1",
        sender: "Gabriella",
        text: "Your inspection is the next step. Once you choose an inspector, I’ll help coordinate everything.",
        createdAt: nowIso,
        internal: false,
        milestoneId: "inspection",
      },
      {
        id: "msg2",
        transactionId: "t4",
        sender: "Anela",
        text: "We’re almost at the finish line! Let’s find a time for your final walk-through.",
        createdAt: nowIso,
        internal: false,
      },
    ],
    activity: [
      {
        id: "a1",
        text: "Jennifer Williams is ready for her final walk-through.",
        createdAt: nowIso,
        transactionId: "t4",
      },
      {
        id: "a2",
        text: "Purchase agreement added to the Martinez document vault.",
        createdAt: nowIso,
        transactionId: "t1",
      },
      {
        id: "a3",
        text: "A new journey started for Carlos & Ana Rivera.",
        createdAt: nowIso,
        transactionId: "t5",
      },
    ],
    drafts: [],
  };
}
