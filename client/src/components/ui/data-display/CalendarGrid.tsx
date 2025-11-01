import { format, getDate, isSameMonth, startOfMonth, eachDayOfInterval, endOfMonth, endOfWeek, startOfWeek, isToday, isSameDay } from "date-fns";
import { Link } from "react-router-dom";
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
      // --- ECCO LA CORREZIONE ---
      // Modificato da appt.cleaning_date a appt.checkIn
      isSameDay(new Date(appt.checkIn), day)
      // --- FINE CORREZIONE ---
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
                <Link
                  key={appt.id}
                  to={`/day/${format(day, "yyyy-MM-dd")}`} // Link to day view
                  className="block p-1.5 text-xs rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 truncate"
                >
                  {appt.name}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
