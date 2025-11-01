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

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const { data: appointments, isLoading } = useQuery<Apartment[]>({ 
    queryKey: [
      "/api/apartments",
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd"),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const res = await fetch(`/api/apartments?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Errore nel caricamento degli appuntamenti");
      }
      return res.json();
    },
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
              
              // --- ECCO LA CORREZIONE ---
              // La riga "captionLayout" è stata rimossa per evitare il crash.
              // --- FINE CORREZIONE ---
              
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
