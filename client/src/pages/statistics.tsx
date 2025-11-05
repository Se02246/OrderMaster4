import { useState, useEffect } from "react"; // Importa useEffect
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import { AppRoutes } from "@server/routes"; // Assicurati che il tipo sia corretto
import { Skeleton } from "@/components/ui/skeleton";

// === INIZIO MODIFICA 2: Importa Input e Button ===
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// === FINE MODIFICA 2 ===

const client = hc<AppRoutes>("/");

// Tipi (potrebbero essere in un file separato)
type AnnualStats = {
  month: string;
  total: number;
}[];

type EmployeeStats = {
  name: string;
  value: number;
}[];

// Colori per il grafico a torta
const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

// Componente per il caricamento
const ChartSkeleton = () => <Skeleton className="h-[350px] w-full" />;

export default function Statistics() {
  // === INIZIO MODIFICA 2: Logica per "qualsiasi anno" ===
  const currentYear = new Date().getFullYear();
  // 'selectedYear' è l'anno attualmente visualizzato nei grafici
  const [selectedYear, setSelectedYear] = useState(currentYear);
  // 'inputYear' è il valore nel campo di testo, gestito come stringa
  const [inputYear, setInputYear] = useState(selectedYear.toString());

  // Rimuoviamo la lista fissa di 5 anni
  // const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Funzione chiamata quando si preme "Visualizza"
  const handleYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = parseInt(inputYear, 10);
    // Aggiorna solo se è un numero valido (es. tra 1900 e 3000)
    if (!isNaN(yearNum) && yearNum > 1900 && yearNum < 3000) {
      setSelectedYear(yearNum);
    } else {
      // Se l'input non è valido, resettalo al valore precedente
      setInputYear(selectedYear.toString());
    }
  };

  // Se selectedYear cambia (es. al primo caricamento), aggiorna l'input
  useEffect(() => {
    setInputYear(selectedYear.toString());
  }, [selectedYear]);
  // === FINE MODIFICA 2 ===

  // Query per l'andamento annuale
  const annualStatsQuery = useQuery({
    queryKey: ["annualStats", selectedYear],
    queryFn: async () => {
      const res = await client.api.stats.annual.$get({
        query: { year: selectedYear.toString() },
      });
      if (!res.ok) {
        throw new Error("Impossibile caricare le statistiche annuali");
      }
      return res.json();
    },
  });

  // Query per le statistiche degli impiegati (primi 5)
  const employeeStatsQuery = useQuery({
    queryKey: ["employeeStats"],
    queryFn: async () => {
      const res = await client.api.stats.employees.$get();
      if (!res.ok) {
        throw new Error("Impossibile caricare le statistiche degli impiegati");
      }
      return res.json();
    },
  });

  // Dati formattati per i grafici
  const annualData = annualStatsQuery.data ?? [];
  const employeeData = employeeStatsQuery.data ?? [];

  const chartConfig = {
    total: {
      label: "Totale (CHF)",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Andamento Annuale (Ordini completati)</CardTitle>
          <CardDescription>
            Mostra gli ordini completati mese per mese nell'anno selezionato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* === INIZIO MODIFICA 2: Sostituisci Select con Input e Button === */}
          <form onSubmit={handleYearSubmit} className="flex justify-end mb-4 space-x-2">
            <Input
              type="number"
              value={inputYear}
              onChange={(e) => setInputYear(e.target.value)}
              placeholder="Inserisci anno"
              className="w-[160px] md:w-[180px]"
              aria-label="Anno"
            />
            <Button type="submit">Visualizza</Button>
          </form>
          {/* === FINE MODIFICA 2 === */}

          {annualStatsQuery.isLoading ? (
            <ChartSkeleton />
          ) : annualStatsQuery.isError ? (
            <div className="text-red-500">Errore nel caricamento dei dati.</div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart data={annualData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `CHF ${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                    formatter={(value) => `CHF ${Number(value).toFixed(2)}`} 
                  />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="total"
                  fill="var(--color-total)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Impiegati Top 5</CardTitle>
          <CardDescription>
            Ordini completati dagli impiegati (ultimi 30 giorni).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeeStatsQuery.isLoading ? (
            <ChartSkeleton />
          ) : employeeStatsQuery.isError ? (
            <div className="text-red-500">Errore nel caricamento dei dati.</div>
          ) : (
            <ChartContainer config={{}} className="h-[350px] w-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                    formatter={(value, name) => `${name}: ${value} ordini`}
                  />}
                />
                <Pie
                  data={employeeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  label={(entry) => `${entry.name} (${entry.value})`}
                >
                  {employeeData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
