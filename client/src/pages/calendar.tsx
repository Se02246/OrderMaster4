import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CalendarGrid from '@/components/ui/data-display/CalendarGrid';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Order } from '@/../../shared/schema';
import { useApi } from '@/lib/api'; // Importa il nuovo hook
import { useNavigate } from 'react-router-dom';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { apiRequest } = useApi(); // Usa il nuovo hook
  const navigate = useNavigate();

  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);

  // Formatta le date per la query API
  const startDate = format(firstDay, 'yyyy-MM-dd');
  const endDate = format(lastDay, 'yyyy-MM-dd');

  // Query per ottenere gli ordini del mese
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders', startDate, endDate],
    queryFn: () => apiRequest('GET', `/orders?start=${startDate}&end=${endDate}`),
    enabled: !!apiRequest, // Attendi che apiRequest sia pronto
  });

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const goToAddOrder = () => {
    // Reindirizza al giorno odierno per aggiungere un ordine
    navigate(`/calendar/${format(new Date(), 'yyyy-MM-dd')}`);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goToToday}>
            Oggi
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl text-center capitalize w-32">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={goToAddOrder}>Aggiungi Ordine</Button>
        </div>
      </CardHeader>
      <CardContent>
        <CalendarGrid
          currentDate={currentDate}
          orders={orders || []}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default CalendarPage;
