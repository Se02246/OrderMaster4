import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Star,
  ClipboardList,
  CreditCard,
  Calendar,
  Euro,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import ApartmentCard from "@/components/ui/data-display/ApartmentCard";
import { ApartmentModal } from "@/components/ui/modals/ApartmentModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import {
  ApartmentWithAssignedEmployees,
  type Apartment,
} from "@shared/schema";
import { ModalState } from "@/components/ui/modals/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { it } in "date-fns/locale";
import { cn } from "@/lib/utils";
import { generateICSContent, downloadICSFile } from "@/lib/calendar-helper";

// Tipi e funzione safeFormatDate (invariati)
type OrderStatus = Apartment["status"];
type PaymentStatus = Apartment["payment_status"];
type SortMode =
  | "date_asc"
  | "date_desc"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

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

  const [favoriteFilter, setFavoriteFilter] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("date_desc");

  const { data: apartments, isLoading, error } = useQuery<
    ApartmentWithAssignedEmployees[]
  >({
    queryKey: ["/api/apartments"],
  });

  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  // Mutazioni (invariate)
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

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      return apiRequest("PATCH", `/api/apartments/${apartmentId}/toggle-favorite`);
    },
    onMutate: async (apartmentId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/apartments"] });
      const previousApartments = queryClient.getQueryData<
        ApartmentWithAssignedEmployees[]
      >(["/api/apartments"]);
      if (previousApartments) {
        queryClient.setQueryData<ApartmentWithAssignedEmployees[]>(
          ["/api/apartments"],
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
      return { previousApartments };
    },
    onError: (err, variables, context) => {
      if (context?.previousApartments) {
        queryClient.setQueryData(
          ["/api/apartments"],
          context.previousApartments
        );
      }
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il preferito. Ripristino.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
    },
  });


  // Handlers (invariati)
  const handleDelete = (apartment: ApartmentWithAssignedEmployees) => {
    setModalState({ type: "delete", data: apartment });
  };

  const confirmDelete = () => {
    if (modalState.type === "delete" && modalState.data) {
      mutation.mutate(modalState.data.id);
    }
  };

  const handleClearFilters = () => {
    setFavoriteFilter(null);
    setStatusFilter(null);
    setPaymentFilter(null);
  };

  const handleFavoriteFilterChange = () => {
    setFavoriteFilter((prev) => (prev === null ? true : null));
  };

  const handleStatusFilterChange = () => {
    setStatusFilter((prev) => {
      if (prev === null) return "Da Fare";
      if (prev === "Da Fare") return "In Corso";
      if (prev === "In Corso") return "Fatto";
      if (prev === "Fatto") return null;
      return null;
    });
  };

  const handlePaymentFilterChange = () => {
    setPaymentFilter((prev) => {
      if (prev === null) return "Da Pagare";
      if (prev === "Da Pagare") return "Pagato";
      if (prev === "Pagato") return null;
      return null;
    });
  };

  const handleSortChange = () => {
    setSortMode((prev) => {
      switch (prev) {
        case "date_desc":
          return "date_asc";
        case "date_asc":
          return "price_desc";
        case "price_desc":
          return "price_asc";
        case "price_asc":
          return "name_desc";
        case "name_desc":
          return "name_asc";
        case "name_asc":
          return "date_desc";
        default:
          return "date_desc";
      }
    });
  };

  const handleAddToCalendarClick = (
    apartment: ApartmentWithAssignedEmployees
  ) => {
    if (!apartment.start_time) {
      toast({
        title: "Orario Mancante",
        description: "Prima scegli un orario per l'ordine.",
        variant: "destructive",
      });
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

  // === INIZIO MODIFICA ===
  // Funzione renderSortButtonContent (MODIFICATA per icon size)
  const renderSortButtonContent = () => {
    const [key, direction] = sortMode.split("_") as [
      "date" | "price" | "name",
      "asc" | "desc",
    ];
    const iconProps = { size: 14, className: "flex-shrink-0" }; // <-- Dimensione 14
    const arrow =
      direction === "asc" ? (
        <ArrowUp {...iconProps} />
      ) : (
        <ArrowDown {...iconProps} />
      );
    let icon;
    if (key === "date") {
      icon = <Calendar {...iconProps} />;
    } else if (key === "price") {
      icon = <Euro {...iconProps} />;
    } else {
      icon = (
        <span
          className="font-semibold"
          style={{ fontSize: "14px", lineHeight: "1" }} // <-- Dimensione 14
        >
          {direction === "asc" ? "AZ" : "ZA"}
        </span>
      );
    }
    return (
      <>
        {icon}
        {arrow}
      </>
    );
  };
  // === FINE MODIFICA ===

  // Logica filtri e ordinamento (invariata)
  const processedAppointments = useMemo(() => {
    // ... (logica invariata) ...
    const search = searchTerm.toLowerCase();
    const filteredBySearch = (apartments || []).filter((apartment) => {
      if (!search) return true;
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
    const filteredByAll = filteredBySearch.filter((apartment) => {
      if (
        favoriteFilter !== null &&
        apartment.is_favorite !== favoriteFilter
      ) {
        return false;
      }
      if (statusFilter !== null && apartment.status !== statusFilter) {
        return false;
      }
      if (paymentFilter !== null && apartment.payment_status !== paymentFilter) {
        return false;
      }
      return true;
    });
    const sorted = filteredByAll.sort((a, b) => {
      switch (sortMode) {
        case "date_asc":
          try {
            const dateA = new Date(
              a.cleaning_date + "T" + (a.start_time || "00:00")
            ).getTime();
            const dateB = new Date(
              b.cleaning_date + "T" + (b.start_time || "00:00")
            ).getTime();
            if (dateA === dateB) return a.id - b.id;
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return dateA - dateB;
          } catch (e) {
            return 0;
          }
        case "date_desc":
          try {
            const dateA = new Date(
              a.cleaning_date + "T" + (a.start_time || "00:00")
            ).getTime();
            const dateB = new Date(
              b.cleaning_date + "T" + (b.start_time || "00:00")
            ).getTime();
            if (dateA === dateB) return a.id - b.id;
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return dateB - dateA;
          } catch (e) {
            return 0;
          }
        case "price_asc":
          const priceA = a.price ? Number(a.price) : Infinity;
          const priceB = b.price ? Number(b.price) : Infinity;
          if (priceA === priceB) return a.id - b.id;
          return priceA - priceB;
        case "price_desc":
          const priceADesc = a.price ? Number(a.price) : -Infinity;
          const priceBDesc = b.price ? Number(b.price) : -Infinity;
          if (priceADesc === priceBDesc) return a.id - b.id;
          return priceBDesc - priceADesc;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name); // Corretto (prima era b.name vs b.name)
        default:
          return 0;
      }
    });
    return sorted;
  }, [
    apartments,
    searchTerm,
    favoriteFilter,
    statusFilter,
    paymentFilter,
    sortMode,
  ]);
  
  const areFiltersActive =
    favoriteFilter !== null ||
    statusFilter !== null ||
    paymentFilter !== null;

  // Skeleton e gestione errore (invariati)
  if (isLoading) {
    // ... (skeleton) ...
  }
  if (error) {
    // ... (error) ...
  }

  return (
    <>
      <div className="space-y-6">
        {/* Barra di ricerca (invariata) */}
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

        {/* === INIZIO MODIFICA === */}
        {/* Pillole di filtro e ordinamento (MODIFICATE nelle classi) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            // size="sm" // Rimosso
            className={cn(
              "gap-2 transition-all h-8 px-2.5 text-xs", // Classi custom
              favoriteFilter === true
                ? "border-yellow-300 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "text-muted-foreground"
            )}
            onClick={handleFavoriteFilterChange}
          >
            <Star
              size={14} // Dimensione 14
              className={cn(
                favoriteFilter === true
                  ? "text-yellow-500"
                  : "text-gray-400"
              )}
              fill={favoriteFilter === true ? "currentColor" : "none"}
            />
            Preferiti
          </Button>
          <Button
            variant="outline"
            // size="sm" // Rimosso
            className={cn(
              "gap-2 transition-all h-8 px-2.5 text-xs", // Classi custom
              statusFilter === null && "text-muted-foreground",
              statusFilter === "Da Fare" &&
                "border-red-300 bg-red-100 text-red-800 hover:bg-red-200",
              statusFilter === "In Corso" &&
                "border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200",
              statusFilter === "Fatto" &&
                "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
            )}
            onClick={handleStatusFilterChange}
          >
            <ClipboardList size={14} /> {/* Dimensione 14 */}
            {statusFilter || "Stato Ordine"}
          </Button>
          <Button
            variant="outline"
            // size="sm" // Rimosso
            className={cn(
              "gap-2 transition-all h-8 px-2.5 text-xs", // Classi custom
              paymentFilter === null && "text-muted-foreground",
              paymentFilter === "Da Pagare" &&
                "border-red-300 bg-red-100 text-red-800 hover:bg-red-200",
              paymentFilter === "Pagato" &&
                "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
            )}
            onClick={handlePaymentFilterChange}
          >
            <CreditCard size={14} /> {/* Dimensione 14 */}
            {paymentFilter || "Pagamento"}
          </Button>
          <Button
            variant="outline"
            // size="sm" // Rimosso
            className="gap-2 text-muted-foreground h-8 px-2.5 text-xs" // Classi custom
            onClick={handleSortChange}
            aria-label={`Ordina per ${sortMode.replace("_", " ")}`}
          >
            {renderSortButtonContent()}
          </Button>
          
          {/* Bottone per pulire i filtri */}
          {areFiltersActive && (
            <Button
              variant="ghost"
              // size="sm" // Rimosso
              className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" // Altezza h-8 w-8
              onClick={handleClearFilters}
              aria-label="Rimuovi tutti i filtri"
              title="Rimuovi tutti i filtri"
            >
              <X size={14} /> {/* Dimensione 14 */}
            </Button>
          )}
        </div>
        {/* === FINE MODIFICA === */}

        {/* Griglia Card (invariata) */}
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
                onAddToCalendarClick={() => handleAddToCalendarClick(apartment)}
                onStatusChange={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/apartments"],
                  })
                }
                onPaymentChange={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["/api/apartments"],
                  })
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">
            {searchTerm ||
            favoriteFilter ||
            statusFilter ||
            paymentFilter
              ? "Nessun ordine trovato per questi filtri."
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
