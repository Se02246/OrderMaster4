import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CalendarGrid from "@/components/ui/data-display/CalendarGrid";
import { ApartmentWithAssignedEmployees } from "@shared/schema";
// === INIZIO MODIFICHE ===
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ApartmentModal } from "@/components/ui/modals/ApartmentModal";
import { ModalState } from "@/components/ui/modals/types";
// === FINE MODIFICHE ===

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // JavaScript months are 0-indexed
  
  // === INIZIO MODIFICHE ===
  // Aggiungo lo stato per il modale di aggiunta
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });
  // === FINE MODIFICHE ===
  
  // Fetch apartment data for current month
  const { data: apartments = [], isLoading } = useQuery<ApartmentWithAssignedEmployees[]>({
    queryKey: [`/api/calendar/${year}/${month}`],
  });

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  // === INIZIO MODIFICHE ===
  // Aggiungo React.Fragment e il bottone fluttuante
  return (
    <>
      <div>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#70fad3]"></div>
            <p className="mt-2 text-gray-600">Caricamento calendario...</p>
          </div>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            apartments={apartments}
            onMonthChange={handleMonthChange}
          />
        )}
      </div>

      {/* Modale per Aggiungere Appuntamento */}
      <ApartmentModal
        isOpen={modalState.type === "add" || modalState.type === "edit"}
        onClose={() => setModalState({ type: null, data: null })}
        apartment={modalState.data}
      />

      {/* NUOVO BOTTONE FLUTTUANTE */}
      <Button
        onClick={() => setModalState({ type: "add", data: null })}
        className="fixed z-40 right-6 bottom-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        aria-label="Aggiungi Appuntamento"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </>
  );
  // === FINE MODIFICHE ===
}
