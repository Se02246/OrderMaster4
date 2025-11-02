import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Employee, Order, Apartment } from '@/../../shared/schema';
import { useApi } from '@/lib/api'; // Importa il nuovo hook
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns/format';
import { it } from 'date-fns/locale';

const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { apiRequest } = useApi(); // Usa il nuovo hook

  // Query per i dettagli del dipendente
  const { data: employee, isLoading: isLoadingEmployee } = useQuery<Employee>({
    queryKey: ['employees', id],
    queryFn: () => apiRequest('GET', `/employees/${id}`),
    enabled: !!apiRequest && !!id, // Attendi apiRequest e id
  });

  // Query per gli ordini del dipendente
  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['orders', 'employee', id],
    queryFn: () => apiRequest('GET', `/orders?employeeId=${id}`),
    enabled: !!apiRequest && !!id, // Attendi apiRequest e id
    select: (data) =>
      data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
  });
  
  // Query per gli appartamenti (per mappare i nomi)
  const { data: apartments, isLoading: isLoadingApartments } = useQuery<Apartment[]>({
    queryKey: ['apartments'],
    queryFn: () => apiRequest('GET', '/apartments'),
    enabled: !!apiRequest,
  });

  const isLoading = isLoadingEmployee || isLoadingOrders || isLoadingApartments;
  
  const getApartmentName = (apartmentId: number | null) => {
    if (!apartments || !apartmentId) return 'Appartamento non specificato';
    return apartments.find((a) => a.id === apartmentId)?.name || 'Appartamento non specificato';
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Colonna Info Cliente */}
      <Card className="md:col-span-1 h-fit">
        <CardHeader>
          {isLoadingEmployee ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : (
            employee && (
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={employee.imageUrl || '/1.png'} />
                  <AvatarFallback>
                    {employee.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{employee.name}</CardTitle>
                <CardDescription>Cliente</CardDescription>
              </div>
            )
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingEmployee ? (
            <>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-full" />
              </div>
            </>
          ) : (
            employee && (
              <>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{employee.email || 'N/D'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{employee.phone || 'N/D'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{employee.address || 'N/D'}</span>
                </div>
              </>
            )
          )}
        </CardContent>
      </Card>

      {/* Colonna Cronologia Ordini */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Cronologia Interventi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingOrders && (
              <>
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </>
            )}
            {!isLoadingOrders && orders && orders.length === 0 && (
              <CardDescription className="text-center py-8">
                Nessun intervento trovato per questo cliente.
              </CardDescription>
            )}
            {!isLoadingOrders &&
              orders?.map((order) => (
                <Card key={order.id} className={`p-4 ${order.isCompleted ? 'bg-muted/50' : ''}`}>
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {order.details || 'Intervento'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getApartmentName(order.apartmentId)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize">
                        {format(new Date(order.date), 'd MMM yyyy', {
                          locale: it,
                        })}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          order.isCompleted
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {order.isCompleted ? 'Completato' : 'In attesa'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDetailPage;
