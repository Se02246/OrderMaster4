import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { format, parse, isValid } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Plus } from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { ApartmentWithAssignedEmployees } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ApartmentCard from "@/components/ui/data-display/ApartmentCard";
import { ApartmentModal } from "@/components/ui/modals/ApartmentModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import { ModalState } from "@/components/ui/modals/types";
import { useToast } from "@/hooks/use-toast";

export default function CalendarDay() {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // --- Gestione Data ---
  const [currentDate, setCurrentDate] = useState<Date | null>(() => {
    if (!dateParam) return new Date(); // Default a oggi se nessun parametro
    const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date());
    return isValid(parsedDate) ? parsedDate : new Date(); // Default a oggi se data non valida
  });

  // Reindirizza se la data non è valida o non è nel formato corretto
  if (!dateParam || !isValid(currentDate) || dateParam !== format(currentDate, "yyyy-MM-dd")) {
    navigate(`/calendar/${format(currentDate || new Date(), "yyyy-MM-dd")}`, { replace: true });
  }
  
  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const displayDate = format(currentDate, "EEEE d MMMM yyyy", { locale: it });

  // --- Fetch Dati ---
  const { data: apartments, isLoading, error } = useQuery<ApartmentWithAssignedEmployees[]>({
    queryKey: [`/api/apartments/date/${formattedDate}`],
  });
  
  // --- Gestione Modali ---
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });

  // --- Mutazione per Eliminazione ---
  const mutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      await apiRequest("DELETE", `/api/apartments/${apartmentId}`);
    },
    onSuccess: () => {
      // Invalida sia la query per data specifica che quella generale
      queryClient.invalidateQueries({ queryKey: [`/api/apartments/date/${formattedDate}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
      // Invalida anche calendario e statistiche
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/calendar') 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/statistics') 
      });
      toast({
        title: "Successo",
        description: "Appuntamento eliminato.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'appuntamento.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setModalState({ type: null, data: null });
    },
  });

  const handleDelete = (apartment: ApartmentWithAssignedEmployees) => {
    setModalState({ type: "delete", data: apartment });
  };

  const confirmDelete = () => {
    if (modalState.type === "delete" && modalState.data) {
      mutation.mutate(modalState.data.id);
    }
  };

  // --- Ordinamento Ordini ---
  const sortedApartments = apartments?.sort((a, b) => {
    // Prova a confrontare gli orari di inizio
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    // Se uno manca, metti quello con orario prima
    if (a.start_time) return -1;
    if (b.start_time) return 1;
    // Altrimenti, usa l'ID (o altro criterio stabile)
    return a.id - b.id;
  });

  // --- Rendering ---
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" /> 
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-60 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">Errore nel caricamento degli appuntamenti: {error.message}</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Pagina */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
             <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/calendar")}
              aria-label="Torna al calendario"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold capitalize">{displayDate}</h1>
          </div>
          {/* Bottone Aggiungi rimosso da qui e spostato in Fixed Action Button */}
        </div>

        {/* Griglia Ordini */}
        {sortedApartments && sortedApartments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedApartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                onEdit={() => setModalState({ type: "edit", data: apartment })}
                onDelete={() => handleDelete(apartment)}
                onStatusChange={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/apartments/date/${formattedDate}`] });
                  queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
                }}
                onPaymentChange={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/apartments/date/${formattedDate}`] });
                  queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">
            Nessun ordine programmato per questo giorno.
          </div>
        )}

        {/* Modali */}
        <ApartmentModal
          isOpen={modalState.type === "add" || modalState.type === "edit"}
          onClose={() => setModalState({ type: null, data: null })}
          apartment={modalState.data}
          // === CORREZIONE BUG MODALE ===
          mode={modalState.type}
          // === FINE CORREZIONE ===
        />
        <ConfirmDeleteModal
          isOpen={modalState.type === "delete"}
          onClose={() => setModalState({ type: null, data: null })}
          onConfirm={confirmDelete}
          isLoading={mutation.isPending}
          itemName={modalState.data?.name || "questo appuntamento"}
        />
      </div>
      
      {/* Bottone Fluttuante per Aggiungere */}
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
}
