import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Apartment } from "shared/schema";
import { Button } from "@/components/ui/button";
import CalendarGrid from "@/components/ui/data-display/CalendarGrid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // 1. Calcola le date
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  // 2. Costruisci i parametri di ricerca
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  // 3. Costruisci la stringa URL completa
  const queryUrl = `/api/apartments?${params.toString()}`;

  // 4. CORREZIONE: Usa lo stesso pattern di home.tsx
  //    Passa l'URL come queryKey e rimuovi queryFn
  const { data: appointments, isLoading } = useQuery<Apartment[]>({ 
    queryKey: [queryUrl],
  });

  const handlePrevMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setIsPickerOpen(false); 
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
          Mese Prec.
        </Button>

        {/* Questo è il Popover che avevi chiesto */}
        <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-[200px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(currentDate, "MMMM yyyy", { locale: it })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={handleNextMonth}>
          Mese Succ.
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <CalendarGrid
          month={currentDate}
          appointments={appointments || []}
        />
      )}
    </div>
  );
}
