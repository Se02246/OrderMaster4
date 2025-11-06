import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
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
// === INIZIO MODIFICHE ===
import { generateICSContent, downloadICSFile } from "@/lib/calendar-helper";
// === FINE MODIFICHE ===

export default function CalendarDay() {
  const [match, params] = useRoute("/calendar/:date");
  const dateParam = params ? params.date : null;
  const [location, navigate] = useLocation();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Gestione Data (invariata)
  const [currentDate, setCurrentDate] = useState<Date | null>(() => {
    if (!dateParam) return new Date();
    const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date());
    return isValid(parsedDate) ? parsedDate : new Date();
  });
  if (
    !dateParam ||
    !isValid(currentDate) ||
    dateParam !== format(currentDate, "yyyy-MM-dd")
  ) {
    navigate(`/calendar/${format(currentDate || new Date(), "yyyy-MM-dd")}`, {
      replace: true,
    });
  }
  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const displayDate = format(currentDate, "EEEE d MMMM yyyy", { locale: it });

  // Fetch Dati (invariata)
  const { data: apartments, isLoading, error } = useQuery<
    ApartmentWithAssignedEmployees[]
  >({
    queryKey: [`/api/apartments/date/${formattedDate}`],
  });

  // Gestione Modali (invariata)
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  // Mutazione per Eliminazione (invariata)
  const mutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      await apiRequest("DELETE", `/api/apartments/${apartmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/apartments/date/${formattedDate}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith("/api/calendar"),
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith("/api/statistics"),
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

  // Mutazione Toggle Favorite (invariata)
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      return apiRequest("PATCH", `/api/apartments/${apartmentId}/toggle-favorite`);
    },
    onMutate: async (apartmentId: number) => {
      const queryKey = [`/api/apartments/date/${formattedDate}`];
      await queryClient.cancelQueries({ queryKey });
      const previousApartments = queryClient.getQueryData<ApartmentWithAssignedEmployees[]>(queryKey);
      if (previousApartments) {
        queryClient.setQueryData<ApartmentWithAssignedEmployees[]>(
          queryKey,
          (oldData) => {
            if (!oldData) return [];
            return oldData.map((apartment) =>
              apartment.id === apartmentId
                ? { ...apartment, is_favorite: !apartment.is_favorite }
                : apartment
            );
          }
        );
      }
      return { previousApartments, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousApartments && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousApartments);
      }
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il preferito. Ripristino.",
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
    },
  });

  // Handler (invariati)
  const handleDelete = (apartment: ApartmentWithAssignedEmployees) => {
    setModalState({ type: "delete", data: apartment });
  };

  const confirmDelete = () => {
    if (modalState.type === "delete" && modalState.data) {
      mutation.mutate(modalState.data.id);
    }
  };

  // === INIZIO MODIFICHE ===
  /**
   * Gestisce il click sull'icona "Aggiungi al Calendario".
   */
  const handleAddToCalendarClick = (
    apartment: ApartmentWithAssignedEmployees
  ) => {
    if (!apartment.start_time) {
      toast({
        title: "Orario Mancante",
        description: "Prima scegli un orario per l'ordine.",
        variant: "destructive",
      });
      // Apriamo il modale di modifica per questo appartamento
      setModalState({ type: "edit", data: apartment });
    } else {
      try {
        const icsContent = generateICSContent(apartment);
        downloadICSFile(apartment.name, icsContent);
      } catch (error) {
        console.error("Errore generazione ICS:", error);
        toast({
          title: "Errore Calendario",
          description: "Impossibile generare il file per il calendario.",
          variant: "destructive",
        });
      }
    }
  };
  // === FINE MODIFICHE ===

  // Ordinamento Ordini (invariato)
  const sortedApartments = apartments?.sort((a, b) => {
    if (a.start_time && b.start_time) {
      const timeComparison = a.start_time.localeCompare(b.start_time);
      if (timeComparison !== 0) {
        return timeComparison;
      }
    }
    if (a.start_time) return -1;
    if (b.start_time) return 1;
    return a.id - b.id;
  });

  // Rendering (invariato)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-red-500 text-center">
        Errore nel caricamento degli appuntamenti: {error.message}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Pagina (invariato) */}
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
        </div>

        {/* Griglia Ordini (MODIFICATA) */}
        {sortedApartments && sortedApartments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedApartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                onEdit={() => setModalState({ type: "edit", data: apartment })}
                onDelete={() => handleDelete(apartment)}
                onToggleFavorite={() =>
                  toggleFavoriteMutation.mutate(apartment.id)
                }
                // === INIZIO MODIFICHE ===
                onAddToCalendarClick={() => handleAddToCalendarClick(apartment)}
                // === FINE MODIFICHE ===
                onStatusChange={() => {
                  queryClient.invalidateQueries({
                    queryKey: [`/api/apartments/date/${formattedDate}`],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["/api/apartments"],
                  });
                }}
                onPaymentChange={() => {
                  queryClient.invalidateQueries({
                    queryKey: [`/api/apartments/date/${formattedDate}`],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["/api/apartments"],
                  });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">
            Nessun ordine programmato per questo giorno.
          </div>
        )}

        {/* Modali (invariati) */}
        <ApartmentModal
          isOpen={modalState.type === "add" || modalState.type === "edit"}
          onClose={() => setModalState({ type: null, data: null })}
          apartment={modalState.data}
          mode={modalState.type}
        />
        <ConfirmDeleteModal
          isOpen={modalState.type === "delete"}
          onClose={() => setModalState({ type: null, data: null })}
          onConfirm={confirmDelete}
          isLoading={mutation.isPending}
          itemName={modalState.data?.name || "questo appuntamento"}
        />
      </div>

      {/* Bottone Fluttuante per Aggiungere (invariato) */}
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
