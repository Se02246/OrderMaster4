import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, fetchApi } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ApartmentCard from "@/components/ui/data-display/ApartmentCard";
import ApartmentModal from "@/components/ui/modals/ApartmentModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import { ApartmentWithAssignedEmployees } from "@shared/schema";
import { ModalState } from "@/components/ui/modals/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: apartments, isLoading, error } = useQuery<ApartmentWithAssignedEmployees[]>({
    queryKey: ["apartments", "today"],
    queryFn: () => fetchApi("/api/apartments?filter=today"),
  });

  // === MODIFICA: La logica per 'themeColor' è stata rimossa ===
  // const [themeColor, setThemeColor] = useState(...);
  // const handleColorChange = (...) => { ... };
  // === FINE MODIFICA ===

  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });

  const mutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      await apiRequest("DELETE", `/api/apartments/${apartmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apartments"] });
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
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
        <h2 className="text-3xl font-bold tracking-tight">Appuntamenti di Oggi</h2>
        <Button onClick={() => setModalState({ type: "add", data: null })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Appuntamento
        </Button>
      </div>

      {/* === MODIFICA: Il box per selezionare il colore è stato rimosso === */}
      {/* <div className="bg-white p-4 rounded-lg shadow">
        ... (input colore rimosso) ...
      </div> 
      */}
      {/* === FINE MODIFICA === */}


      {apartments && apartments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apartments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              onEdit={() => setModalState({ type: "edit", data: apartment })}
              onDelete={() => handleDelete(apartment)}
              onStatusChange={() => queryClient.invalidateQueries({ queryKey: ["apartments"] })}
              onPaymentChange={() => queryClient.invalidateQueries({ queryKey: ["apartments"] })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">
          Nessun appuntamento per oggi.
        </div>
      )}

      {/* Modali */}
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
