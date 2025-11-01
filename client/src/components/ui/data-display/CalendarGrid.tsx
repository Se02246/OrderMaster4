import { format, getDate, isSameMonth, startOfMonth, eachDayOfInterval, endOfMonth, endOfWeek, startOfWeek, isToday, isSameDay, parseISO } from "date-fns";
// 1. Importiamo 'useNavigate' per la navigazione
import { useNavigate } from "react-router-dom";
import { Apartment } from "shared/schema";

interface CalendarGridProps {
  month: Date;
  appointments: Apartment[];
}

export default function CalendarGrid({ month, appointments }: CalendarGridProps) {
  const navigate = useNavigate(); // Hook per la navigazione
  const startDate = startOfWeek(startOfMonth(month));
  const endDate = endOfWeek(endOfMonth(month));
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((appt) => {
      // --- 3. CORREZIONE ORDINI NON VISIBILI ---
      // Il campo 'checkIn' è una stringa ISO. 
      // Dobbiamo usare 'parseISO' per convertirla correttamente in un oggetto Date
      // prima di passarla a 'isSameDay'. 'new Date()' non è affidabile.
      const checkInDate = parseISO(appt.checkIn);
      return isSameDay(checkInDate, day);
    });
  };

  // Funzione per gestire il click sulla cella
  const handleDayClick = (day: Date) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    navigate(`/day/${formattedDate}`);
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
            // --- 2. CORREZIONE NAVIGAZIONE ---
            // Aggiunto onClick per navigare e cursor-pointer
            onClick={() => handleDayClick(day)}
            className={`h-40 border-r border-b border-gray-200 p-2 cursor-pointer ${
              isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <time
              dateTime={format(day, "yyyy-MM-dd")}
              className={`text-sm font-medium ${
                // --- 3. CORREZIONE COLORE GIORNO CORRENTE ---
                // Sostituito 'text-blue-600' con 'text-primary' (che è rosso)
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
