// se02246/ordermaster4/OrderMaster4-impl_login/client/src/components/ui/layout/Header.tsx

import { PanelLeft, Search } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react'; // Importa UserButton

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavLink } from 'react-router-dom'; // Usato per il breadcrumb

// Definiamo le props che App.tsx passerà
interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      
      {/* Bottone "Hamburger" per Sidebar Mobile */}
      <Button
        size="icon"
        variant="outline"
        className="md:hidden" // Mostra solo su mobile
        onClick={toggleSidebar} // Chiama la funzione da App.tsx
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Breadcrumb (Esempio, puoi renderlo dinamico se vuoi) */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <NavLink to="/">Dashboard</NavLink>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {/* Esempio di breadcrumb attivo
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pagina Corrente</BreadcrumbPage>
          </BreadcrumbItem>
          */}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spazio vuoto per spingere l'avatar a destra */}
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Puoi rimettere la search bar qui se serve */}
      </div>

      {/* Avatar Utente - Gestito da Clerk */}
      <UserButton afterSignOutUrl="/sign-in" />
      
    </header>
  );
}

export default Header;
