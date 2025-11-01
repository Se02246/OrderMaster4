// 1. Importa 'useMemo' da react
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react"; 
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

// 2. Funzione helper per formattare le date in modo sicuro
const safeFormatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    // Controlla se la data è valida
    if (isNaN(date.getTime())) {
      return ""; // Restituisci stringa vuota se non valida
    }
    return format(date, "P p", { locale: it });
  } catch (e) {
    console.error("Errore formattazione data:", e);
    return ""; // Restituisci stringa vuota in caso di errore
  }
};

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: apartments, isLoading, error } = useQuery<ApartmentWithAssignedEmployees[]>({
    queryKey: ["/api/apartments"],
  });

  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });

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

  const handleDelete = (apartment: ApartmentWithAssignedEmployees) => {
    setModalState({ type: "delete", data: apartment });
  };

  const confirmDelete = () => {
    if (modalState.type === "delete" && modalState.data) {
      mutation.mutate(modalState.data.id);
    }
  };

  // 3. Logica di ordinamento e filtraggio racchiusa in useMemo
  const processedAppointments = useMemo(() => {
    // Ordina creando una copia
    const sorted = (apartments || [])
      .slice() 
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    const search = searchTerm.toLowerCase();
    // Se la ricerca è vuota, restituisci direttamente l'array ordinato
    if (!search) return sorted; 

    // Altrimenti, filtra l'array ordinato
    return sorted.filter((apartment) => {
      
      // Usa la funzione sicura per le date
      const checkInDate = safeFormatDate(apartment.checkIn);
      const checkOutDate = safeFormatDate(apartment.checkOut);

      const fieldsToSearch = [
        apartment.name,
        apartment.address,
        apartment.customerName,
        apartment.customerPhone,
        apartment.notes,
        apartment.price?.toString(), 
        apartment.status,
        checkInDate,
        checkOutDate,
      ];

      return fieldsToSearch.some((field) =>
        field ? field.toLowerCase().includes(search) : false
      );
    });
  }, [apartments, searchTerm]); // 4. Dipendenze: ricalcola solo quando i dati o la ricerca cambiano

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" /> 
          <Skeleton className="h-10 w-48" />
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

        <Button onClick={() => setModalState({ type: "add", data: null })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Appuntamento
        </Button>
      </div>

      {/* 5. Mappa i processedAppointments (calcolati con useMemo) */}
      {processedAppointments && processedAppointments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processedAppointments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              onEdit={() => setModalState({ type: "edit", data: apartment })}
              onDelete={() => handleDelete(apartment)}
              onStatusChange={() => queryClient.invalidateQueries({ queryKey: ["/api/apartments"] })}
              onPaymentChange={() => queryClient.invalidateQueries({ queryKey: ["/api/apartments"] })}
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
      />
      <ConfirmDeleteModal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null, data: null })}
        onConfirm={confirmDelete}
        isLoading={mutation.isPending}
        itemName={modalState.data?.name || "questo appuntamento"}
      />
    </div>
  );
}
