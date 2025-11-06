// === INIZIO MODIFICA ===
import { useState } from "react";
// === FINE MODIFICA ===
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// === INIZIO MODIFICA ===
import { ClipboardList, Trophy, CalendarClock, Zap, Euro } from "lucide-react"; // Aggiunto Euro
// === FINE MODIFICA ===
import { formatDateForDisplay } from "@/lib/date-utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
// === INIZIO MODIFICA ===
import { format, parse } from "date-fns";
import { it } from "date-fns/locale";
// Nuovi import per i selettori
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
// === FINE MODIFICA ===

// Definisco i nuovi tipi per i dati
type TopEmployee = {
  name: string;
  count: number;
};

type ProductiveDay = {
  date: string;
  count: number;
};

type OrdersByTime = {
  day?: string; // "YYYY-MM-DD"
  month?: string; // "YYYY-MM"
  count: number;
};

// === INIZIO MODIFICA ===
type EarningsByTime = {
  day?: string;
  month?: string;
  earnings: number;
};
// === FINE MODIFICA ===

type MostProductiveMonth = {
  month: string; // "YYYY-MM"
  count: number;
};

type StatisticsData = {
  totalOrders: number;
  topEmployees: TopEmployee[];
  busiestDays: ProductiveDay[];
  ordersPerDayInMonth: OrdersByTime[];
  ordersPerMonthInYear: OrdersByTime[];
  // === INIZIO MODIFICA ===
  earningsPerMonthInYear: EarningsByTime[];
  // === FINE MODIFICA ===
  mostProductiveMonth: MostProductiveMonth;
};

// Funzione helper per l'API
async function fetchStatistics(year: number, monthYear: string): Promise<StatisticsData> {
  const res = await fetch(`/api/statistics?year=${year}&monthYear=${monthYear}`);
  if (!res.ok) {
    throw new Error("Errore nel caricamento delle statistiche");
  }
  return res.json();
}

// === INIZIO MODIFICA: Configurazione Grafici (spostata su per chiarezza) ===
const ordersByMonthConfig = {
  count: { label: "Ordini", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const ordersByDayConfig = {
  count: { label: "Ordini", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const earningsByMonthConfig = {
  earnings: { label: "Guadagni", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;
// === FINE MODIFICA ===


export function StatisticsPage() {
  
  // === INIZIO MODIFICA: Stati per i selettori globali ===
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  // === FINE MODIFICA ===

  const { data, isLoading, error } = useQuery<StatisticsData, Error>({
    queryKey: ["statistics", selectedYear, selectedMonth], // Aggiunti stati alla queryKey
    queryFn: () => fetchStatistics(selectedYear, selectedMonth), // Passa gli stati alla fetch
    staleTime: 1000 * 60 * 5, // 5 minuti
  });

  // === INIZIO MODIFICA: Preparazione dati per i grafici ===
  // Dati per Ordini per Mese (Annuale)
  const ordersByMonthData = data?.ordersPerMonthInYear.map(item => ({
    ...item,
    monthDisplay: format(parse(item.month!, "yyyy-MM", new Date()), "MMM", { locale: it }),
  })) || [];

  // Dati per Ordini per Giorno (Mensile)
  const ordersByDayData = data?.ordersPerDayInMonth.map(item => ({
    ...item,
    dayDisplay: format(parse(item.day!, "yyyy-MM-dd", new Date()), "d", { locale: it }),
  })) || [];

  // Dati per Guadagni per Mese (Annuale)
  const earningsByMonthData = data?.earningsPerMonthInYear.map(item => ({
    ...item,
    monthDisplay: format(parse(item.month!, "yyyy-MM", new Date()), "MMM", { locale: it }),
  })) || [];
  
  // Formattatore per valuta
  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  // === FINE MODIFICA ===


  if (error) {
    return <div className="text-red-500 p-4">Errore: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Statistiche</h1>

      {/* === INIZIO MODIFICA: Selettori globali === */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year-selector">Seleziona Anno (per grafici annuali)</Label>
              <Input
                id="year-selector"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                placeholder="Es. 2024"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="month-selector">Seleziona Mese (per grafico giornaliero)</Label>
              <Input
                id="month-selector"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* === FINE MODIFICA === */}


      {/* Sezione Card Superiori */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Totali</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{data?.totalOrders}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Collaboratori</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <ul className="text-sm">
                {data?.topEmployees.map((emp, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{index + 1}. {emp.name || 'N/D'}</span>
                    <span className="font-bold">{emp.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giorni più Produttivi</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <ul className="text-sm">
                {data?.busiestDays.map((day, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{formatDateForDisplay(day.date)}</span>
                    <span className="font-bold">{day.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mese più Produttivo ({selectedYear})</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-3/4" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.mostProductiveMonth?.month ? 
                  format(parse(data.mostProductiveMonth.month, "yyyy-MM", new Date()), "MMMM", { locale: it }) 
                  : 'N/D'}
                ({data?.mostProductiveMonth?.count} ordini)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sezione Grafici */}
      {/* === INIZIO MODIFICA: Layout griglia aggiornato e grafici === */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
        
        {/* Grafico 1: Ordini per Mese (Annuale) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            {/* Titolo aggiornato dinamicamente */}
            <CardTitle>Ordini per Mese (Anno: {selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer config={ordersByMonthConfig} className="h-[300px] w-full">
                <LineChart data={ordersByMonthData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="monthDisplay"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltipContent />
                  <Line
                    dataKey="count"
                    type="monotone"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Grafico 2: Ordini per Giorno (Mensile) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            {/* Titolo aggiornato e selettori rimossi */}
            <CardTitle>
              Ordini per Giorno (Mese: {format(parse(selectedMonth, "yyyy-MM", new Date()), "MMMM yyyy", { locale: it })})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer config={ordersByDayConfig} className="h-[300px] w-full">
                <LineChart data={ordersByDayData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="dayDisplay"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltipContent />
                  <Line
                    dataKey="count"
                    type="monotone"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Grafico 3: Guadagni per Mese (Annuale) - NUOVO */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Guadagni Totali per Mese (Anno: {selectedYear})</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer config={earningsByMonthConfig} className="h-[300px] w-full">
                <LineChart data={earningsByMonthData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="monthDisplay"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                  />
                  <ChartTooltipContent 
                    formatter={formatCurrency}
                  />
                  <Line
                    dataKey="earnings"
                    type="monotone"
                    stroke="var(--color-earnings)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

      </div>
      {/* === FINE MODIFICA === */}
    </div>
  );
}
