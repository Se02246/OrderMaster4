import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Home, Calendar, Users, LineChart, Settings } from 'lucide-react';
// Importa NavLink e useLocation da react-router-dom
import { NavLink, useLocation } from 'react-router-dom'; 
import { cn } from '@/lib/utils'; // Importa cn per unire le classi

// Helper per la navigazione
const NavItem = ({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) => {
  const location = useLocation();
  // Controlla se il percorso base è attivo (es. /employees/1 deve attivare /employees)
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
            isActive && 'bg-accent text-accent-foreground', // Stile per link attivo
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="sr-only">{label}</span>
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};

const Sidebar = () => {
  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          {/* Logo - puoi rimettere il tuo Package2 se lo avevi */}
          <NavLink
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8"
          >
            <span className="">CM</span>
            <span className="sr-only">Clean Master</span>
          </NavLink>
          
          <NavItem to="/" icon={Home} label="Dashboard" />
          <NavItem to="/calendar" icon={Calendar} label="Calendario" />
          <NavItem to="/employees" icon={Users} label="Clienti" />
          <NavItem to="/statistics" icon={LineChart} label="Statistiche" />
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Link alle impostazioni (non ancora esistente ma utile) */}
              <NavLink
                to="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Impostazioni</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Impostazioni</TooltipContent>
          </Tooltip>
        </nav>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
