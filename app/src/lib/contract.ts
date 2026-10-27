/**
 * ELI5: Turns a contract's dates and day-counts into the list of deadlines a broker must hit.
 * What: Computes the 8 New Mexico contract deadlines (earnest ... settlement) from TransactionTerms.
 * Owns: deadline calculation and its validation/explanation helpers.
 * Depends on: dates.ts, types.ts.
 */
import {
  addCalendarDays,
  createHolidayCalendar,
  formatDate,
  parseIsoDate,
  rollToBusinessDay,
} from "@/lib/dates";
import type {
  ContractDeadline,
  DayAnchor,
  EarnestAnchor,
  HolidayCalendar,
  TransactionTerms,
} from "@/lib/types";

export const DEADLINE_DISCLAIMER =
  "Broker workflow aid only, not legal advice. Review the signed agreement and all addenda.";

const DEFAULT_EARNEST_DAYS = 3;
const DEFAULT_RESOLUTION_DAYS = 5;
const DEFAULT_TITLE_DAYS = 7;
const DEFAULT_REPAIR_DAYS = 3;
const DEFAULT_WALKTHROUGH_DAYS = 3;

/** Must be a positive whole number (original `L0`). */
export function assertPositiveDays(days: number, fieldName: string): void {
  if (!Number.isInteger(days) || days <= 0) {
    throw new RangeError(`${fieldName} must be a positive whole number of days.`);
  }
}

/** Day count with a default when undefined (original `Ia`). */
function daysOrDefault(days: number | undefined, fallback: number, fieldName: string): number {
  if (days === undefined) {
    return fallback;
  }
  assertPositiveDays(days, fieldName);
  return days;
}

function validateDayCounts(terms: TransactionTerms): void {
  const dayFields: Array<[string, number | undefined]> = [
    ["earnestDays", terms.earnestDays],
    ["inspectionDays", terms.inspectionDays],
    ["resolutionDays", terms.resolutionDays],
    ["documentsDays", terms.documentsDays],
    ["titleDays", terms.titleDays],
    ["walkThroughDays", terms.walkThroughDays],
    ["repairDays", terms.repairDays],
  ];
  for (const [fieldName, days] of dayFields) {
    if (days !== undefined) {
      assertPositiveDays(days, fieldName);
    }
  }
}

/** Blank -> null, otherwise validated ISO date (original `ha`). */
function optionalIsoDate(value: string | undefined): string | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  parseIsoDate(value);
  return value;
}

/** Anchor date + days, rolled to a business day (original `ni`). */
function daysAfter(
  anchor: string | null,
  days: number | undefined,
  calendar: HolidayCalendar,
): string | null {
  if (anchor === null || days === undefined) {
    return null;
  }
  return rollToBusinessDay(addCalendarDays(anchor, days), calendar);
}

/** Anchor date minus days, rolled to a business day (original `rD`). */
function daysBefore(
  anchor: string | null,
  days: number,
  calendar: HolidayCalendar,
): string | null {
  if (anchor === null) {
    return null;
  }
  return rollToBusinessDay(addCalendarDays(anchor, -days), calendar);
}

/** Pick the anchor date for inspection/documents (original `Yb`). */
function pickAnchorDate(
  anchor: DayAnchor | undefined,
  acceptance: string | null,
  independentConsideration: string | null,
): string | null {
  if (anchor === "acceptance") {
    return acceptance;
  }
  if (anchor === "independentConsideration") {
    return independentConsideration;
  }
  return null;
}

/** Wording for the earnest-money anchor (original `iD`). */
function describeEarnestAnchor(anchor: EarnestAnchor): string {
  if (anchor === "acceptance") {
    return "acceptance";
  }
  if (anchor === "inspection") {
    return "inspection objection deadline";
  }
  return "actual resolution event (enter a specific earnest deadline)";
}

/** Wording for the inspection/documents anchor (original `Gb`). */
function describeDayAnchor(anchor: DayAnchor | undefined): string {
  if (anchor === "acceptance") {
    return "acceptance";
  }
  if (anchor === "independentConsideration") {
    return "independent-consideration delivery";
  }
  return "a selected anchor";
}

/** Rolling-rule explanation appended to every note (original `Ka`). */
function rollingNote(isSpecificDate: boolean): string {
  if (isSpecificDate) {
    return " Specific agreement dates remain fixed and do not roll for weekends or holidays.";
  }
  return " Calendar-day calculation: the day after the anchor is day one; a final Saturday, Sunday, or listed legal holiday rolls forward to the next business day. Named holiday dates are used without assumed weekend observance; add observed/local closures to holidayOverrides.";
}

/** Build one deadline row (original `Wa`). */
function buildDeadline(
  id: string,
  label: string,
  date: string | null,
  source: string,
  note: string,
): ContractDeadline {
  return { id, label, date, source, note: `${note} ${DEADLINE_DISCLAIMER}` };
}

const NEGOTIATED_NOTE =
  "No default applies; enter a negotiated specific date or a positive day count and anchor.";

/**
 * All contract deadlines for a transaction's terms (original `Za`).
 * Throws RangeError/TypeError on invalid input; callers catch it.
 */
export function calculateContractDeadlines(terms: TransactionTerms): ContractDeadline[] {
  const calendar = createHolidayCalendar(terms.holidayOverrides);
  validateDayCounts(terms);

  const acceptance = optionalIsoDate(terms.acceptance);
  const settlement = optionalIsoDate(terms.settlement);
  const independentConsideration = optionalIsoDate(terms.independentConsideration);
  const inspectionDate = optionalIsoDate(terms.inspectionDate);
  const documentsDate = optionalIsoDate(terms.documentsDate);
  const resolutionDate = optionalIsoDate(terms.resolutionDate);
  const titleReceipt = optionalIsoDate(terms.titleReceipt);
  const earnestDate = optionalIsoDate(terms.earnestDate);
  const walkThroughDate = optionalIsoDate(terms.walkThroughDate);

  const inspectionDeadline =
    inspectionDate ??
    daysAfter(
      pickAnchorDate(terms.inspectionAnchor, acceptance, independentConsideration),
      terms.inspectionDays,
      calendar,
    );
  const documentsDeadline =
    documentsDate ??
    daysAfter(
      pickAnchorDate(terms.documentsAnchor, acceptance, independentConsideration),
      terms.documentsDays,
      calendar,
    );
  const resolutionDays = daysOrDefault(
    terms.resolutionDays,
    DEFAULT_RESOLUTION_DAYS,
    "resolutionDays",
  );
  const resolutionDeadline =
    resolutionDate ?? daysAfter(inspectionDeadline, resolutionDays, calendar);

  const earnestDays = daysOrDefault(terms.earnestDays, DEFAULT_EARNEST_DAYS, "earnestDays");
  const earnestAnchor: EarnestAnchor = terms.earnestAnchor ?? "acceptance";
  let earnestAnchorDate: string | null = null;
  if (earnestAnchor === "acceptance") {
    earnestAnchorDate = acceptance;
  } else if (earnestAnchor === "inspection") {
    earnestAnchorDate = inspectionDeadline;
  }
  const earnestDeadline = earnestDate ?? daysAfter(earnestAnchorDate, earnestDays, calendar);

  const titleDays = daysOrDefault(terms.titleDays, DEFAULT_TITLE_DAYS, "titleDays");
  const titleDeadline = daysAfter(titleReceipt, titleDays, calendar);

  const repairDays = daysOrDefault(terms.repairDays, DEFAULT_REPAIR_DAYS, "repairDays");
  const repairDeadline = daysBefore(settlement, repairDays, calendar);

  const walkThroughDays = daysOrDefault(
    terms.walkThroughDays,
    DEFAULT_WALKTHROUGH_DAYS,
    "walkThroughDays",
  );
  const walkThroughWindowStart =
    settlement === null ? null : addCalendarDays(settlement, -walkThroughDays);
  let walkThroughNote: string;
  if (walkThroughDate) {
    walkThroughNote = `Scheduled walk-through date. Para. 43 permits a walk-through within ${walkThroughDays} calendar days before settlement.`;
  } else if (walkThroughWindowStart && settlement) {
    walkThroughNote = `Scheduling window: ${formatDate(walkThroughWindowStart)} through ${formatDate(settlement)}. Para. 43 is a window, not a mandatory walk-through date.`;
  } else {
    walkThroughNote = `Para. 43 is a ${walkThroughDays}-calendar-day pre-settlement window, not a mandatory walk-through date. Settlement is needed to determine the window.`;
  }

  return [
    buildDeadline(
      "earnest",
      "Earnest money due",
      earnestDeadline,
      earnestDate
        ? "Para. 6 — specific date"
        : `Para. 6 — ${earnestDays} calendar days from ${describeEarnestAnchor(earnestAnchor)}`,
      `Earnest money delivery deadline.${rollingNote(earnestDate !== null)}`,
    ),
    buildDeadline(
      "documents",
      "Existing documents due",
      documentsDeadline,
      documentsDate
        ? "Para. 32 — specific date"
        : terms.documentsDays === undefined
          ? "Para. 32 — negotiated deadline required"
          : `Para. 32 — ${terms.documentsDays} calendar days from ${describeDayAnchor(terms.documentsAnchor)}`,
      terms.documentsDays === undefined && !documentsDate
        ? `${NEGOTIATED_NOTE}${rollingNote(false)}`
        : `Seller document delivery deadline.${rollingNote(documentsDate !== null)}`,
    ),
    buildDeadline(
      "inspection",
      "Inspection objection deadline",
      inspectionDeadline,
      inspectionDate
        ? "Para. 33(A) — specific date"
        : terms.inspectionDays === undefined
          ? "Para. 33(A) — negotiated deadline required"
          : `Para. 33(A) — ${terms.inspectionDays} calendar days from ${describeDayAnchor(terms.inspectionAnchor)}`,
      terms.inspectionDays === undefined && !inspectionDate
        ? `${NEGOTIATED_NOTE}${rollingNote(false)}`
        : `Inspection, document, and due-diligence objection deadline.${rollingNote(inspectionDate !== null)}`,
    ),
    buildDeadline(
      "resolution",
      "Resolution deadline",
      resolutionDeadline,
      resolutionDate
        ? "Para. 33(D) — specific date"
        : `Para. 33(D) — ${resolutionDays} calendar days from the inspection objection deadline`,
      `Resolution of objections deadline.${rollingNote(resolutionDate !== null)}`,
    ),
    buildDeadline(
      "title",
      "Title review deadline",
      titleDeadline,
      `Para. 37(C)(i) — ${titleDays} calendar days after actual title-commitment receipt`,
      `Title-review period starts only after actual receipt of the title commitment and referenced documents.${rollingNote(false)}`,
    ),
    buildDeadline(
      "repairs",
      "Repair completion deadline",
      repairDeadline,
      `Para. 33(D)(iii) — ${repairDays} calendar days before settlement`,
      `Applies if Seller agreed to complete repairs before closing.${rollingNote(false)}`,
    ),
    buildDeadline(
      "walkthrough",
      "Pre-closing walk-through",
      walkThroughDate,
      walkThroughDate
        ? "Para. 43 — scheduled date"
        : `Para. 43 — within ${walkThroughDays} calendar days before settlement`,
      walkThroughNote,
    ),
    buildDeadline(
      "settlement",
      "Settlement / signing",
      settlement,
      "Para. 44(A) — settlement/signing date",
      "Specific settlement dates remain fixed and do not roll for weekends or holidays.",
    ),
  ];
}
