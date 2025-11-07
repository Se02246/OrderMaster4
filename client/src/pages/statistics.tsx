// === INIZIO MODIFICA ===
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Trophy, CalendarClock, Zap } from "lucide-react";
import { formatDateForDisplay } from "@/lib/date-utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format, parse } from "date-fns";
import { it } from "date-fns/locale";
// Nuovi import per i selettori
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// === INIZIO MODIFICA (Aggiunta import Button) ===
import { Button } from "@/components/ui/button";
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
  mostProductiveMonth: MostProductiveMonth;
  earningsPerMonthInYear: { month: string; total: number }[];
};

// Configurazione per i grafici
const chartConfig = {
  ordini: {
    label: "Ordini",
    color: "hsl(var(--primary))", // Usa il colore primario
  },
  guadagni: {
    label: "Guadagni (€)",
    color: "hsl(145, 63%, 49%)", // Verde
  },
} satisfies ChartConfig;

// Formatta il mese "YYYY-MM" in "MMM" (es. "Gen")
const formatMonthAbbr = (dateStr: string) => {
  try {
    const date = parse(dateStr, "yyyy-MM", new Date());
    return format(date, "MMM", { locale: it });
  } catch (e) {
    return dateStr;
  }
};

// Formatta il giorno "YYYY-MM-DD" in "dd" (es. "01")
const formatDay = (dateStr: string) => {
  try {
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    return format(date, "dd");
  } catch (e) {
    return dateStr;
  }
};

// Formatta il mese "YYYY-MM" in "Mese Anno" (es. "Novembre 2023")
const formatMonthYear = (dateStr: string) => {
  try {
    const date = parse(dateStr, "yyyy-MM", new Date());
    return format(date, "MMMM yyyy", { locale: it });
  } catch (e) {
    return dateStr;
  }
};


export default function Statistics() {
  // === INIZIO MODIFICA ===
  // Stato per i selettori di data
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  // === INIZIO MODIFICA (Stato temporaneo per input) ===
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  // === FINE MODIFICA ===
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  // === INIZIO MODIFICA (Rimozione limite 5 anni) ===
  // // Genera lista di anni per il dropdown (es. 5 anni indietro)
  // const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  // === FINE MODIFICA ===

  // Aggiorna la query per includere gli stati (ora usa selectedYear, che non cambia con l'input)
  const { data: stats, isLoading, isError } = useQuery<StatisticsData>({
    queryKey: [`/api/statistics?year=${selectedYear}&monthYear=${selectedMonth}`],
  });
  // === FINE MODIFICA ===

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Caricamento statistiche...</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
        <h3 className="text-xl font-medium text-gray-700 mb-2">Errore</h3>
        <p className="text-gray-500">Impossibile caricare le statistiche.</p>
      </div>
    );
  }

  // Prepara i dati per i grafici
  const dayData = stats.ordersPerDayInMonth.map(d => ({
    day: formatDay(d.day!), // 'day' è sicuramente presente qui
    ordini: d.count,
  }));

  const monthData = stats.ordersPerMonthInYear.map(m => ({
    month: formatMonthAbbr(m.month!), // 'month' è sicuramente presente qui
    ordini: m.count,
  }));
  
  const earningsData = stats.earningsPerMonthInYear.map(m => ({
    month: formatMonthAbbr(m.month!),
    guadagni: Number(m.total || 0),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-dark">Statistiche</h2>

      {/* Griglia Metriche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ordini Totali */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Totali</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Totale ordini registrati</p>
          </CardContent>
        </Card>
        
        {/* Mese Più Produttivo (Ora basato sull'anno selezionato) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mese Produttivo ({selectedYear})</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.mostProductiveMonth.count > 0 ? (
              <>
                <div className="text-2xl font-bold">{stats.mostProductiveMonth.count} ordini</div>
                <p className="text-xs text-muted-foreground">
                  in {formatMonthYear(stats.mostProductiveMonth.month)}
                </p>
              </>
            ) : (
               <p className="text-sm text-muted-foreground">Nessun dato per il {selectedYear}.</p>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Clienti */}
        <Card>
          <CardHeader className="pb-2">
            {/* === INIZIO CORREZIONE ERRORE BUILD === */}
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 3 Clienti
            </CardTitle>
            {/* === FINE CORREZIONE ERRORE BUILD === */}
          </CardHeader>
          <CardContent>
            {stats.topEmployees.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2">
                {stats.topEmployees.map((employee, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{employee.name || "Cliente non definito"}</span>
                    <span className="text-muted-foreground"> ({employee.count} {employee.count === 1 ? 'ordine' : 'ordini'})</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Giorni Produttivi */}
        <Card>
          <CardHeader className="pb-2">
            {/* === INIZIO CORREZIONE ERRORE BUILD === */}
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-500" />
              Top 3 Giorni
            </CardTitle>
            {/* === FINE CORREZIONE ERRORE BUILD === */}
          </CardHeader>
          <CardContent>
            {stats.busiestDays.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2">
                {stats.busiestDays.map((day, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{formatDateForDisplay(day.date)}</span>
                    <span className="text-muted-foreground"> ({day.count} {day.count === 1 ? 'ordine' : 'ordini'})</span>
                  </li>
                ))}
              </ol>
            ) : (
               <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Griglia per i grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Grafico Ordini per Giorno */}
        <Card>
          {/* === INIZIO MODIFICA === */}
          <CardHeader>
            <CardTitle>Ordini per Giorno ({formatMonthYear(selectedMonth)})</CardTitle>
             <div className="w-full max-w-sm pt-2">
              <Label htmlFor="month-picker" className="text-sm font-medium">Seleziona Mese</Label>
              <Input
                id="month-picker"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardHeader>
          {/* === FINE MODIFICA === */}
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dayData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: -20, 
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    domain={[3, 'auto']} // Minimo 3
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    dataKey="ordini"
                    type="monotone"
                    stroke="var(--color-ordini)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Grafico Ordini per Mese */}
        <Card>
          {/* === INIZIO MODIFICA === */}
          <CardHeader>
            <CardTitle>Ordini per Mese ({selectedYear})</CardTitle>
            {/* === INIZIO MODIFICA: Layout per Input + Bottone === */}
            <div className="w-full max-w-sm pt-2 space-y-2">
              <Label htmlFor="year-picker" className="text-sm font-medium">Seleziona Anno</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="year-picker"
                  type="number"
                  placeholder="Inserisci anno"
                  value={tempYear} // Usa stato temporaneo
                  onChange={(e) => setTempYear(Number(e.target.value))} // Aggiorna stato temporaneo
                  className="mt-1"
                  step="1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedYear(tempYear);
                    }
                  }}
                />
                <Button onClick={() => setSelectedYear(tempYear)} className="mt-1">
                  Applica
                </Button>
              </div>
            </div>
            {/* === FINE MODIFICA === */}
          </CardHeader>
          {/* === FINE MODIFICA === */}
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthData}
                   margin={{
                    top: 5,
                    right: 10,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    domain={[3, 'auto']} // Minimo 3
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    dataKey="ordini"
                    type="monotone"
                    stroke="var(--color-ordini)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Grafico Guadagni Mensili */}
        <Card>
          <CardHeader>
            <CardTitle>Guadagni Mensili ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={earningsData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: -20, 
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `€${value}`}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                      indicator="dot" 
                      formatter={(value, name) => {
                        if (name === 'guadagni') {
                          return (
                            <div className="flex flex-1 justify-between leading-none">
                              <span className="text-muted-foreground">Guadagni</span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {`€${Number(value).toFixed(2)}`}
                              </span>
                            </div>
                          )
                        }
                        return null;
                      }}
                    />}
                  />
                  <Legend />
                  <Bar
                    dataKey="guadagni"
                    fill="var(--color-guadagni)"
                    radius={4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
