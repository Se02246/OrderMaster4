import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Trash2,
  Edit,
} from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { Order, Employee, Apartment } from '@/../../shared/schema';
import { useApi } from '@/lib/api'; // Importa il nuovo hook
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmDeleteModal from '@/components/ui/modals/ConfirmDeleteModal';
// Assicurati che i percorsi di importazione dei modali siano corretti
import OrderModal from '@/components/ui/modals/OrderModal';
import ApartmentModal from '@/components/ui/modals/ApartmentModal';


type OrderWithEmployee = Order & { employee?: Employee; apartment?: Apartment };

const CalendarDayPage = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { apiRequest } = useApi(); // Usa il nuovo hook

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Stati per i modali extra
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);

  const parsedDate = date ? parseISO(date) : new Date();
  if (!isValid(parsedDate)) {
    // Gestisci il caso di data non valida, magari reindirizzando
    return <div>Data non valida</div>;
  }

  const formattedDate = format(parsedDate, 'yyyy-MM-dd');
  const displayDate = format(parsedDate, "EEEE d MMMM yyyy", { locale: it });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['orders', formattedDate],
    queryFn: () => apiRequest('GET', `/orders?start=${formattedDate}&end=${formattedDate}`),
    enabled: !!apiRequest, // Attendi che apiRequest sia pronto
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => apiRequest('GET', '/employees'),
    enabled: !!apiRequest,
  });

  const { data: apartments, isLoading: isLoadingApartments } = useQuery<Apartment[]>({
    queryKey: ['apartments'],
    queryFn: () => apiRequest('GET', '/apartments'),
    enabled: !!apiRequest,
  });

  // Mutazioni
  const createOrderMutation = useMutation({
    mutationFn: (newOrder: Omit<Order, 'id'>) =>
      apiRequest('POST', '/orders', newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', formattedDate] });
      toast({ title: 'Successo', description: 'Ordine creato.' });
      setIsOrderModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (updatedOrder: Order) =>
      apiRequest('PUT', `/orders/${updatedOrder.id}`, updatedOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', formattedDate] });
      toast({ title: 'Successo', description: 'Ordine aggiornato.' });
      setIsOrderModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', formattedDate] });
      toast({ title: 'Successo', description: 'Ordine eliminato.' });
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Gestori di navigazione e modali
  const goToDay = (day: Date) => {
    navigate(`/calendar/${format(day, 'yyyy-MM-dd')}`);
  };

  const handleOpenNewOrderModal = () => {
    setSelectedOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleOpenEditOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleOpenDeleteModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitOrder = (data: any) => {
    const orderData = {
      ...data,
      date: formattedDate,
      employeeId: data.employeeId ? parseInt(data.employeeId, 10) : null,
      apartmentId: data.apartmentId ? parseInt(data.apartmentId, 10) : null,
      isCompleted: data.isCompleted,
    };

    if (selectedOrder) {
      updateOrderMutation.mutate({ ...selectedOrder, ...orderData });
    } else {
      createOrderMutation.mutate(orderData);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedOrder) {
      deleteOrderMutation.mutate(selectedOrder.id);
    }
  };

  // Unisci i dati
  const combinedOrders: OrderWithEmployee[] =
    orders?.map((order) => ({
      ...order,
      employee: employees?.find((e) => e.id === order.employeeId),
      apartment: apartments?.find((a) => a.id === order.apartmentId),
    })) || [];

  const isLoading = isLoadingOrders || isLoadingEmployees || isLoadingApartments;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToDay(subDays(parsedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <CardTitle className="text-2xl">{displayDate}</CardTitle>
            <Button variant="link" asChild className="-mt-1">
              <Link to="/calendar">Torna al calendario</Link>
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToDay(addDays(parsedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={handleOpenNewOrderModal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Ordine
          </Button>
          <Button variant="outline" onClick={() => setIsApartmentModalOpen(true)}>
            Aggiungi Appartamento
          </Button>
        </div>
        
        <div className="space-y-4">
          {isLoading && (
            <>
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </>
          )}
          {!isLoading && combinedOrders.length === 0 && (
            <CardDescription className="text-center py-8">
              Nessun ordine programmato per questo giorno.
            </CardDescription>
          )}
          {!isLoading &&
            combinedOrders.map((order) => (
              <Card key={order.id} className={`flex items-center p-4 ${order.isCompleted ? 'bg-muted/50' : ''}`}>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">
                    {order.employee?.name || 'Cliente non assegnato'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.apartment?.name || 'Appartamento non specificato'}
                  </p>
                  <p className="text-sm">{order.details}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenEditOrderModal(order)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleOpenDeleteModal(order)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </CardContent>

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleSubmitOrder}
        defaultValues={selectedOrder}
        employees={employees || []}
        apartments={apartments || []}
      />

      <ApartmentModal
        isOpen={isApartmentModalOpen}
        onClose={() => setIsApartmentModalOpen(false)}
        // onSubmit è gestito internamente dal modale
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Elimina Ordine"
        description="Sei sicuro di voler eliminare questo ordine? Questa azione non può essere annullata."
      />
    </Card>
  );
};

export default CalendarDayPage;
