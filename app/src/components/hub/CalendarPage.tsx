/**
 * ELI5: The calendar page showing contract deadlines on a month grid.
 * What: Month grid + agenda for the selected day, with .ics export.
 * Owns: the /calendar workspace view.
 * Depends on: HubContext, Primitives, CalendarEmptyIcon, lib/contract, lib/dates, lib/download.
 */
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CircleAlert, Download } from "lucide-react";
import { toast } from "sonner";
import { useHub } from "@/contexts/HubContext";
import { PageHeading } from "@/components/hub/Primitives";
import { CalendarEmptyIcon } from "@/components/hub/CalendarEmptyIcon";
import { calculateContractDeadlines } from "@/lib/contract";
import { formatDate, todayInDenver } from "@/lib/dates";
import { downloadTextFile } from "@/lib/download";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CALENDAR_CELL_COUNT = 42;
const ICS_FILENAME = "flores-contract-milestones.ics";

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CalendarPage({ onOpen }: { onOpen: (transactionId: string) => void }) {
  const { state } = useHub();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(`${todayInDenver()}T12:00:00`));
  const [selectedDay, setSelectedDay] = useState(todayInDenver());
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());
  const gridDays = Array.from({ length: CALENDAR_CELL_COUNT }, (_unused, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return toIsoDate(day);
  });
  const events = state.transactions.flatMap((transaction) =>
    calculateContractDeadlines(transaction.terms)
      .filter((deadline) => deadline.date && !transaction.completedMilestones.includes(deadline.id))
      .map((deadline) => ({ ...deadline, transaction })),
  );
  const today = todayInDenver();

  function shiftMonth(delta: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function exportCalendar() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Flores Property Group//Transaction Hub//EN",
      ...events.flatMap((event) => [
        "BEGIN:VEVENT",
        `UID:${event.transaction.id}-${event.id}@floreshub`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART;VALUE=DATE:${event.date?.replace(/-/g, "")}`,
        `SUMMARY:${event.label} - ${event.transaction.address.replace(/[;,\n]/g, " ")}`,
        `DESCRIPTION:${event.source.replace(/[;,\n]/g, " ")}. Review signed contract and addenda.`,
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ];
    downloadTextFile(ICS_FILENAME, lines.join("\r\n"), "text/calendar");
    toast.success("Calendar exported. Import it into Google Calendar or your calendar app.");
  }

  return (
    <>
      <PageHeading
        title="A clear view of what’s ahead."
        description="Contract milestones, signing days, and a little more peace of mind."
        action={
          <button className="button secondary" onClick={exportCalendar}>
            <Download size={15} />
            Export calendar
          </button>
        }
      />
      <div className="calendar-layout">
        <section className="calendar-panel">
          <div className="calendar-heading">
            <h2>{visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
            <div>
              <button
                className="button secondary small"
                onClick={() => {
                  setVisibleMonth(new Date(`${today}T12:00:00`));
                  setSelectedDay(today);
                }}
              >
                Today
              </button>
              <button className="icon-button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <ChevronLeft size={17} />
              </button>
              <button className="icon-button" onClick={() => shiftMonth(1)} aria-label="Next month">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <div className="calendar-week">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {gridDays.map((day) => {
              const dayEvents = events.filter((event) => event.date === day);
              return (
                <button
                  key={day}
                  className={`calendar-cell ${Number(day.slice(5, 7)) !== visibleMonth.getMonth() + 1 ? "muted-day" : ""} ${day === today ? "today" : ""} ${selectedDay === day ? "selected-day" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span>{Number(day.slice(8))}</span>
                  {dayEvents.slice(0, 2).map((event, index) => (
                    <small key={index}>{event.label}</small>
                  ))}
                  {dayEvents.length > 2 && <em>+{dayEvents.length - 2} more</em>}
                </button>
              );
            })}
          </div>
        </section>
        <aside className="calendar-agenda">
          <span className="eyebrow">ON THE HORIZON</span>
          <h2>{formatDate(selectedDay)}</h2>
          {events
            .filter((event) => event.date === selectedDay)
            .map((event) => (
              <button
                key={`${event.transaction.id}-${event.id}`}
                className="calendar-event"
                onClick={() => onOpen(event.transaction.id)}
              >
                <CalendarDays size={16} />
                <div>
                  <strong>{event.label}</strong>
                  <span>{event.transaction.address}</span>
                  <small>{event.source}</small>
                </div>
                <ChevronRight size={14} />
              </button>
            ))}
          {events.every((event) => event.date !== selectedDay) && (
            <div className="quiet-empty">
              <CalendarEmptyIcon />
              <p>No contract milestones on this day.</p>
            </div>
          )}
          <div className="form-note">
            <CircleAlert size={15} />
            <span>
              Walk-through entries show the start of the permitted window. Verify each date against the signed
              agreement.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
