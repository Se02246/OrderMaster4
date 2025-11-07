import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { format, parse, isValid } from "date-fns";
import { it } from "date-fns/locale"; // === CORREZIONE: 'from' e non 'in' ===
import {
  ArrowLeft,
  Plus,
  Star,
  ClipboardList,
  CreditCard,
  X,
  Calendar,
  Euro,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import {
  ApartmentWithAssignedEmployees,
  type Apartment,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ApartmentCard from "@/components/ui/data-display/ApartmentCard";
import { ApartmentModal } from "@/components/ui/modals/ApartmentModal";
import ConfirmDeleteModal from "@/components/ui/modals/ConfirmDeleteModal";
import { ModalState } from "@/components/ui/modals/types";
import { useToast } from "@/hooks/use-toast";
import { generateICSContent, downloadICSFile } from "@/lib/calendar-helper";
import { cn } from "@/lib/utils";

// Definizioni Tipi (invariate)
type OrderStatus = Apartment["status"];
type PaymentStatus = Apartment["payment_status"];
type SortMode =
  | "date_asc"
  | "date_desc"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export default function CalendarDay() {
  const [match, params] = useRoute("/calendar/:date");
  const dateParam = params ? params.date : null;
  const [location, navigate] = useLocation();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Stati (invariati)
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("date_desc");

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

  // Mutazioni (invariate)
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

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      return apiRequest(
        "PATCH",
        `/api/apartments/${apartmentId}/toggle-favorite`
      );
    },
    onMutate: async (apartmentId: number) => {
      const queryKey = [`/api/apartments/date/${formattedDate}`];
      await queryClient.cancelQueries({ queryKey });
      const previousApartments = queryClient.getQueryData<
        ApartmentWithAssignedEmployees[]
      >(queryKey);
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
  
  // Funzione renderSortButtonContent (invariata)
  const renderSortButtonContent = () => {
    const [key, direction] = sortMode.split("_") as [
      "date" | "price" | "name",
      "asc" | "desc",
    ];
    const iconProps = { size: 14, className: "flex-shrink-0" };
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
          style={{ fontSize: "14px", lineHeight: "1" }}
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

  // Handler Aggiungi a Calendario (invariato)
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

  // filtri attivi (invariato)
  const areFiltersActive =
    favoriteFilter !== null ||
    statusFilter !== null ||
    paymentFilter !== null;

  // Logica filtri e ordinamento (invariata)
  const processedAppointments = useMemo(() => {
    const filtered = (apartments || []).filter((apartment) => {
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

    const sorted = filtered.sort((a, b) => {
      switch (sortMode) {
        case "date_asc":
          const timeA = a.start_time || "00:00";
          const timeB = b.start_time || "00:00";
          if (timeA.localeCompare(timeB) !== 0) {
            return timeA.localeCompare(timeB);
          }
          return a.id - b.id;
        case "date_desc":
          const timeADesc = a.start_time || "23:59";
          const timeBDesc = b.start_time || "23:59";
           if (timeBDesc.localeCompare(timeADesc) !== 0) {
            return timeBDesc.localeCompare(timeADesc);
          }
           return a.id - b.id;
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
          return b.name.localeCompare(a.name);
        default:
          const defaultTimeA = a.start_time || "00:00";
          const defaultTimeB = b.start_time || "00:00";
          return defaultTimeB.localeCompare(defaultTimeA);
      }
    });

    return sorted;
  }, [apartments, favoriteFilter, statusFilter, paymentFilter, sortMode]);

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

        {/* Pillole di filtro e ordinamento (invariate) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className={cn(
              "gap-2 transition-all h-8 px-2.5 text-xs",
              favoriteFilter === true
                ? "border-yellow-300 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "text-muted-foreground"
            )}
            onClick={handleFavoriteFilterChange}
          >
            <Star
              size={14}
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
            className={cn(
              "gap-2 transition-all h-8 px-2.5 text-xs",
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
            <ClipboardList size={14} />
            {statusFilter || "Stato Ordine"}
          </Button>
          <Button
            variant="outline"
            className={cn(
              "gap-2 transition-all h-8 px-2.5 text-xs",
              paymentFilter === null && "text-muted-foreground",
              paymentFilter === "Da Pagare" &&
                "border-red-300 bg-red-100 text-red-800 hover:bg-red-200",
              paymentFilter === "Pagato" &&
                "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
            )}
            onClick={handlePaymentFilterChange}
          >
            <CreditCard size={14} />
            {paymentFilter || "Pagamento"}
          </Button>
          
          <Button
            variant="outline"
            className="gap-2 text-muted-foreground h-8 px-2.5 text-xs"
            onClick={handleSortChange}
            aria-label={`Ordina per ${sortMode.replace("_", " ")}`}
          >
            {renderSortButtonContent()}
          </Button>

          {areFiltersActive && (
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleClearFilters}
              aria-label="Rimuovi tutti i filtri"
              title="Rimuovi tutti i filtri"
            >
              <X size={14} />
            </Button>
          )}
        </div>

        {/* Griglia Ordini (invariata) */}
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
            {areFiltersActive
              ? "Nessun ordine trovato per questi filtri."
              : "Nessun ordine programmato per questo giorno."}
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

      {/* Bottone Fluttuante (invariato) */}
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
