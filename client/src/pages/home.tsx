import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import ApartmentCard from "@/components/ui/data-display/ApartmentCard";
import { ApartmentModal } from "@/components/ui/modals/ApartmentModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import { ApartmentWithAssignedEmployees } from "@shared/schema";
import { ModalState } from "@/components/ui/modals/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const safeFormatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }
    return format(date, "P p", { locale: it });
  } catch (e) {
    console.error("Errore formattazione data:", e);
    return "";
  }
};

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: apartments, isLoading, error } = useQuery<
    ApartmentWithAssignedEmployees[]
  >({
    queryKey: ["/api/apartments"],
  });

  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  // Mutazione per l'eliminazione (invariata)
  const mutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      await apiRequest("DELETE", `/api/apartments/${apartmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      toast({
        title: "Successo",
        description: "Appuntamento eliminato.",
      });
    },
    onError: (error) => {
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

  // === MUTAZIONE PREFERITI (MODIFICATA) ===
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      return apiRequest("PATCH", `/api/apartments/${apartmentId}/toggle-favorite`);
    },
    
    // === MODIFICA ===
    // Ho sostituito 'setQueryData' (aggiornamento ottimistico)
    // con 'invalidateQueries'.
    // Questo forza un ricaricamento dei dati dal server.
    // È il metodo più sicuro per garantire che sia la stella
    // sia l'ordinamento (nel useMemo) si aggiornino correttamente.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
    },
    // === FINE MODIFICA ===

    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il preferito.",
        variant: "destructive",
      });
      // Ricarica i dati in caso di errore
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
    },
  });
  // === FINE MUTAZIONE ===

  const handleDelete = (apartment: ApartmentWithAssignedEmployees) => {
    setModalState({ type: "delete", data: apartment });
  };

  const confirmDelete = () => {
    if (modalState.type === "delete" && modalState.data) {
      mutation.mutate(modalState.data.id);
    }
  };

  // Logica di ordinamento e filtro (invariata)
  const processedAppointments = useMemo(() => {
    const search = searchTerm.toLowerCase();

    const filtered = (apartments || []).filter((apartment) => {
      if (!search) return true; // Se la ricerca è vuota, includi tutto

      // Usa la funzione sicura per le date
      const cleaningDate = safeFormatDate(apartment.cleaning_date);

      const fieldsToSearch = [
        apartment.name,
        apartment.status,
        apartment.payment_status,
        apartment.notes,
        apartment.price?.toString(),
        cleaningDate,
        apartment.start_time,
        ...apartment.employees.map((e) => `${e.first_name} ${e.last_name}`),
      ];

      return fieldsToSearch.some((field) =>
        field ? field.toLowerCase().includes(search) : false
      );
    });

    // Ordina: preferiti in alto, poi per data
    return filtered.sort((a, b) => {
      // Regola 1: I preferiti (is_favorite = true) vengono prima
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;

      // Regola 2: Se entrambi (o nessuno) sono preferiti, ordina per data
      try {
        const dateA = new Date(
          a.cleaning_date + "T" + (a.start_time || "00:00")
        ).getTime();
        const dateB = new Date(
          b.cleaning_date + "T" + (b.start_time || "00:00")
        ).getTime();
        if (isNaN(dateA)) return 1; // Metti le date non valide in fondo
        if (isNaN(dateB)) return -1;
        return dateA - dateB; // Ordine cronologico
      } catch (e) {
        return 0;
      }
    });
  }, [apartments, searchTerm]);

  // Skeleton e gestione errore (invariati)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca ordini..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {processedAppointments && processedAppointments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedAppointments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                onEdit={() => setModalState({ type: "edit", data: apartment })}
                onDelete={() => handleDelete(apartment)}
                onToggleFavorite={() =>
                  toggleFavoriteMutation.mutate(apartment.id)
                }
                // Queste props non sembrano usate dalla ApartmentCard, ma le lascio
                onStatusChange={() =>
                  queryClient.invalidateQueries({ queryKey: ["/api/apartments"] })
                }
                onPaymentChange={() =>
                  queryClient.invalidateQueries({ queryKey: ["/api/apartments"] })
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">
            {searchTerm
              ? "Nessun ordine trovato per questa ricerca."
              : "Non ci sono ordini da mostrare."}
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

      {/* Bottone fluttuante (invariato) */}
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
