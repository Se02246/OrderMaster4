import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { Order } from '@/../../shared/schema';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom'; // MODIFICATO: Importa da react-router-dom
import { Skeleton } from '../skeleton';

interface CalendarGridProps {
  currentDate: Date;
  orders: Order[];
  isLoading: boolean;
}

const CalendarGrid = ({
  currentDate,
  orders,
  isLoading,
}: CalendarGridProps) => {
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const start = startOfWeek(firstDay, { locale: it });
  const end = endOfWeek(lastDay, { locale: it });

  const days = eachDayOfInterval({ start, end });
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Raggruppa gli ordini per giorno
  const ordersByDay = orders.reduce(
    (acc, order) => {
      const dayString = format(new Date(order.date), 'yyyy-MM-dd');
      if (!acc[dayString]) {
        acc[dayString] = [];
      }
      acc[dayString].push(order);
      return acc;
    },
    {} as Record<string, Order[]>,
  );

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
      {/* Intestazione giorni della settimana */}
      {daysOfWeek.map((day) => (
        <div
          key={day}
          className="py-2 text-center text-sm font-medium text-muted-foreground bg-muted/50"
        >
          {day}
        </div>
      ))}

      {/* Griglia dei giorni */}
      {isLoading &&
        [...Array(35)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-none" />
        ))}

      {!isLoading &&
        days.map((day) => {
          const dayString = format(day, 'yyyy-MM-dd');
          const dayOrders = ordersByDay[dayString] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <Link
              key={dayString}
              // MODIFICATO: da 'href' a 'to'
              to={`/calendar/${dayString}`}
              className={cn(
                'relative flex h-24 flex-col p-2 bg-background hover:bg-muted/50 transition-colors',
                !isCurrentMonth && 'bg-muted/25 text-muted-foreground',
              )}
            >
              <time
                dateTime={dayString}
                className={cn(
                  'text-sm font-medium',
                  isToday &&
                    'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground',
                )}
              >
                {format(day, 'd')}
              </time>
              {dayOrders.length > 0 && (
                <div className="mt-1 flex-1 overflow-y-auto">
                  <ul className="space-y-1">
                    {dayOrders.slice(0, 2).map((order) => (
                      <li key={order.id}>
                        <span className="block truncate text-xs font-medium text-foreground p-1 bg-primary/20 rounded-sm">
                          {order.details || 'Ordine'}
                        </span>
                      </li>
                    ))}
                    {dayOrders.length > 2 && (
                      <li className="text-xs text-muted-foreground">
                        + {dayOrders.length - 2} altri
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </Link>
          );
        })}
    </div>
  );
};

export default CalendarGrid;
