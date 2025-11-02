import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee, Order } from '@/../../shared/schema';
import { useApi } from '@/lib/api'; // Importa il nuovo hook
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns/format';
import { it } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { apiRequest } = useApi(); // Usa il nuovo hook

  // Query per i prossimi ordini
  const { data: upcomingOrders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['orders', 'upcoming'],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0];
      // Nota che l'endpoint non ha più /api
      return apiRequest('GET', `/orders?start=${today}&end=2100-01-01`); 
    },
    enabled: !!apiRequest, // Attendi che apiRequest sia pronto
    select: (data) => data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5),
  });

  // Query per i clienti (dipendenti)
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => apiRequest('GET', '/employees'),
    enabled: !!apiRequest, // Attendi che apiRequest sia pronto
  });

  // Mappa gli ordini ai clienti
  const getEmployeeForOrder = (employeeId: number | null) => {
    if (!employees || !employeeId) return null;
    return employees.find((e) => e.id === employeeId);
  };

  const isLoading = isLoadingOrders || isLoadingEmployees;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Prossimi Interventi</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && upcomingOrders && upcomingOrders.length > 0 ? (
            <div className="space-y-8">
              {upcomingOrders.map((order) => {
                const employee = getEmployeeForOrder(order.employeeId);
                const orderDate = new Date(order.date);
                return (
                  <div key={order.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={employee?.imageUrl || '/1.png'}
                        alt={employee?.name || 'Avatar'}
                      />
                      <AvatarFallback>
                        {employee?.name ? employee.name[0].toUpperCase() : 'N/A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {employee?.name || 'Cliente non assegnato'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.details || 'Nessun dettaglio'}
                      </p>
                    </div>
                    <div className="ml-auto font-medium capitalize">
                      {format(orderDate, "EEEE d MMMM", { locale: it })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             !isLoading && <p className="text-sm text-muted-foreground">Nessun intervento imminente.</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Clienti Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && employees && employees.length > 0 ? (
            <div className="space-y-8">
              {employees.slice(0, 5).map((employee) => (
                <Link to={`/employees/${employee.id}`} key={employee.id} className="flex items-center hover:bg-muted/50 p-2 rounded-lg -m-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={employee.imageUrl || '/1.png'}
                      alt={employee.name}
                    />
                    <AvatarFallback>{employee.name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {employee.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {employee.email}
                    </p>
                  </div>
                  <div className="ml-auto font-medium"></div>
                </Link>
              ))}
            </div>
          ) : (
            !isLoading && <p className="text-sm text-muted-foreground">Nessun cliente trovato.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
