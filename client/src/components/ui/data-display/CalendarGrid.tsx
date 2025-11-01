import { format, getDate, isSameMonth, startOfMonth, eachDayOfInterval, endOfMonth, endOfWeek, startOfWeek, isToday, isSameDay, parseISO } from "date-fns";
// 1. RIMOSSO import 'useNavigate' per correggere la build
import { Apartment } from "shared/schema";

interface CalendarGridProps {
  month: Date;
  appointments: Apartment[];
  // 2. Aggiunta prop per gestire il click dal genitore
  onDayClick: (day: Date) => void; 
}

export default function CalendarGrid({ month, appointments, onDayClick }: CalendarGridProps) {
  const startDate = startOfWeek(startOfMonth(month));
  const endDate = endOfWeek(endOfMonth(month));
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((appt) => {
      // 3. Correzione per visualizzare gli ordini (parseISO)
      const checkInDate = parseISO(appt.checkIn);
      return isSameDay(checkInDate, day);
    });
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
            // 4. Usa la prop onDayClick per la navigazione
            onClick={() => onDayClick(day)}
            className={`h-40 border-r border-b border-gray-200 p-2 cursor-pointer ${
              isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <time
              dateTime={format(day, "yyyy-MM-dd")}
              className={`text-sm font-medium ${
                // 5. Correzione colore giorno corrente
                isCurrentToday ? "text-primary font-bold" : 
                isCurrentMonth ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {dayOfMonth}
            </time>
            <div className="mt-1 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(10rem - 2rem)' }}>
              {appointmentsForDay.map((appt) => (
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
