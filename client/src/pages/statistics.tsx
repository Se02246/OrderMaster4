import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import { Employee, Order } from '@/../../shared/schema';
import { useApi } from '@/lib/api'; // Importa il nuovo hook
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { format } from 'date-fns';

// Colori per il grafico a torta
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const StatisticsPage = () => {
  const { apiRequest } = useApi(); // Usa il nuovo hook

  // Query per tutti gli ordini
  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['orders', 'all'], // Chiave diversa per tutti gli ordini
    queryFn: () => apiRequest('GET', '/orders?start=2000-01-01&end=2100-01-01'),
    enabled: !!apiRequest, // Attendi che apiRequest sia pronto
  });

  // Query per tutti i clienti
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => apiRequest('GET', '/employees'),
    enabled: !!apiRequest,
  });

  const isLoading = isLoadingOrders || isLoadingEmployees;

  // Calcola i dati per i grafici
  const chartData = useMemo(() => {
    if (!orders || !employees) return { barData: [], pieData: [] };

    // Dati per il grafico a barre (Ordini per Mese)
    const monthlyCounts: { [key: string]: { total: number, completed: number } } = {};
    orders.forEach((order) => {
      const month = format(new Date(order.date), 'yyyy-MM'); // Usa yyyy-MM per ordinare
      if (!monthlyCounts[month]) {
        monthlyCounts[month] = { total: 0, completed: 0 };
      }
      monthlyCounts[month].total += 1;
      if (order.isCompleted) {
        monthlyCounts[month].completed += 1;
      }
    });
    
    const barData = Object.keys(monthlyCounts)
      .sort() // Ordina le date yyyy-MM
      .map((monthKey) => ({
        month: format(new Date(monthKey + '-02'), 'MMM yy'), // Formatta per la visualizzazione
        Totale: monthlyCounts[monthKey].total,
        Completati: monthlyCounts[monthKey].completed,
      }));

    // Dati per il grafico a torta (Ordini per Cliente)
    const employeeOrderCounts: { [key: string]: number } = {};
    orders.forEach((order) => {
      let name = 'Non assegnato';
      if (order.employeeId) {
        const employee = employees.find((e) => e.id === order.employeeId);
        name = employee?.name || 'Cliente (ID: ' + order.employeeId + ')';
      }
      employeeOrderCounts[name] = (employeeOrderCounts[name] || 0) + 1;
    });
    
    const pieData = Object.keys(employeeOrderCounts).map((name) => ({
      name,
      value: employeeOrderCounts[name],
    }));

    return { barData, pieData };
  }, [orders, employees]);

  // Dati aggregati
  const totalOrders = orders?.length || 0;
  const totalCompleted = orders?.filter((o) => o.isCompleted).length || 0;
  const totalEmployees = employees?.length || 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card aggregati */}
      <Card>
        <CardHeader>
          <CardTitle>Interventi Totali</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <Skeleton className="h-10 w-16" />
          ) : (
            <div className="text-4xl font-bold">{totalOrders}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Interventi Completati</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <Skeleton className="h-10 w-16" />
          ) : (
            <div className="text-4xl font-bold">{totalCompleted}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Clienti Attivi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEmployees ? (
            <Skeleton className="h-10 w-16" />
          ) : (
            <div className="text-4xl font-bold">{totalEmployees}</div>
          )}
        </CardContent>
      </Card>

      {/* Grafico a Barre */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Interventi per Mese</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ChartContainer config={{}} className="h-64 w-full">
              <BarChart data={chartData.barData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="Totale" fill="var(--color-primary)" radius={4} />
                <Bar dataKey="Completati" fill="var(--color-secondary)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Grafico a Torta */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione Clienti</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-full" />
          ) : (
            <ChartContainer config={{}} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsPage;
