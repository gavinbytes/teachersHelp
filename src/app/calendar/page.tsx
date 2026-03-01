import { CalendarView } from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">
          View your class schedules and assignment due dates
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
