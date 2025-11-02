import React from 'react';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Home,
  Calendar,
  Users,
  LineChart,
  PanelLeft,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react'; // Importa UserButton di Clerk

// Mappa per i percorsi
const breadcrumbNameMap: { [key: string]: string } = {
  '/': 'Dashboard',
  '/calendar': 'Calendario',
  '/employees': 'Clienti',
  '/statistics': 'Statistiche',
};

// Funzione helper per ottenere il nome del breadcrumb
const getBreadcrumbName = (to: string, value: string) => {
  if (breadcrumbNameMap[to]) {
    return breadcrumbNameMap[to];
  }
  if (to.startsWith('/calendar/')) {
    return value; // Mostra la data
  }
  if (to.startsWith('/employees/')) {
    return 'Dettaglio Cliente'; // Nome generico per il dettaglio
  }
  return null;
};

const Header = () => {
  const location = useLocation();

  // Genera i breadcrumb
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbs = pathnames.map((value, index) => {
    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;
    const name = getBreadcrumbName(to, value);

    if (!name) return null; // Non mostrare se non mappato

    return (
      <React.Fragment key={to}>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isLast ? (
            <BreadcrumbPage>{name}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <NavLink to={to}>{name}</NavLink>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
      </React.Fragment>
    );
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <NavLink
              to="/"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-5 w-5" />
              Dashboard
            </NavLink>
            <NavLink
              to="/calendar"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Calendar className="h-5 w-5" />
              Calendario
            </NavLink>
            <NavLink
              to="/employees"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Users className="h-5 w-5" />
              Clienti
            </NavLink>
            <NavLink
              to="/statistics"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <LineChart className="h-5 w-5" />
              Statistiche
            </NavLink>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <NavLink to="/">Dashboard</NavLink>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Spazio per la ricerca, se necessario */}
      </div>
      
      {/* SOSTITUITO! 
        Rimuove il vecchio pulsante di logout e usa il bottone di Clerk.
      */}
      <UserButton afterSignOutUrl="/sign-in" />
      
    </header>
  );
};

export default Header;
