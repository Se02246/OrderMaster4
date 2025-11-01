import { format, getDate, isSameMonth, startOfMonth, eachDayOfInterval, endOfMonth, endOfWeek, startOfWeek, isToday, isSameDay } from "date-fns";
// 1. Rimuoviamo l'import di 'react-router-dom'
import { Apartment } from "shared/schema";

interface CalendarGridProps {
  month: Date;
  appointments: Apartment[];
}

export default function CalendarGrid({ month, appointments }: CalendarGridProps) {
  const startDate = startOfWeek(startOfMonth(month));
  const endDate = endOfWeek(endOfMonth(month));
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((appt) => 
      // 2. Correzione per la "schermata bianca"
      isSameDay(new Date(appt.checkIn), day)
    );
  };

  return (
    <div className="grid grid-cols-7 border-t border-l border-gray-200">
      {daysInMonth.map((day, index) => {
        const appointmentsForDay = getAppointmentsForDay(day);
        const dayOfMonth = getDate(day);
        const isCurrentMonth = isSameMonth(day, month);
        const isCurrentToday = isToday(day);

        return (
          <div
            key={index}
            className={`h-40 border-r border-b border-gray-200 p-2 ${
              isCurrentMonth ? "bg-white" : "bg-gray-50"
            }`}
          >
            <time
              dateTime={format(day, "yyyy-MM-dd")}
              className={`text-sm font-medium ${
                isCurrentToday ? "text-blue-600 font-bold" : 
                isCurrentMonth ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {dayOfMonth}
            </time>
            <div className="mt-1 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(10rem - 2rem)' }}>
              {appointmentsForDay.map((appt) => (
                // 3. Correzione per l'errore di build:
                //    Sostituito il <Link> con un <div>
                <div
                  key={appt.id}
                  className="block p-1.5 text-xs rounded-md bg-blue-100 text-blue-800 truncate"
                >
                  {appt.name}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
