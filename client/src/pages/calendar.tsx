import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Apartment } from "shared/schema";
import { Button } from "@/components/ui/button";

// --- ECCO LA CORREZIONE ---
// Rimuoviamo le parentesi graffe {} da CalendarGrid
import CalendarGrid from "@/components/ui/data-display/CalendarGrid";
// --- FINE CORREZIONE ---

import { Skeleton } from "@/components/ui/skeleton";
// 1. Importa i componenti Popover, Calendar e l'icona
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
  // 2. Aggiungi stato per il Popover
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  // Fetch appointments for the current month
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

  // 3. Handler per quando si seleziona una data dal Popover
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setIsPickerOpen(false); // Chiude il popover
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        {/* Pulsante Mese Precedente (invariato) */}
        <Button variant="outline" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
          Mese Prec.
        </Button>

        {/* 4. Sostituisci H2 con il selettore Popover */}
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
              // Questa è la riga chiave per mostrare i dropdown!
              captionLayout="dropdown-nav" 
              fromYear={new Date().getFullYear() - 10}
              toYear={new Date().getFullYear() + 10}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Pulsante Mese Successivo (invariato) */}
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
