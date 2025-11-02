// se02246/ordermaster4/OrderMaster4-impl_login/client/src/components/ui/layout/Sidebar.tsx

import {
  Bell,
  Calendar,
  Home,
  LineChart,
  Package2,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger, // Rimosso SheetTrigger, il controllo è in App.tsx
} from '@/components/ui/sheet';

// Definiamo le props che App.tsx passerà
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente NavLink per gestire lo stato attivo
const SidebarNavLink = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => (
  <NavLink
    to={to}
    end // 'end' assicura che solo la rotta esatta sia attiva (es. / non matcha /calendar)
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
        isActive ? 'bg-muted text-primary' : ''
      }`
    }
  >
    <Icon className="h-4 w-4" />
    {label}
  </NavLink>
);

// Contenuto effettivo della navigazione
const NavigationContent = () => (
  <nav className="grid items-start gap-2 text-sm font-medium">
    <SidebarNavLink to="/" icon={Home} label="Dashboard" />
    <SidebarNavLink to="/calendar" icon={Calendar} label="Calendario" />
    <SidebarNavLink to="/employees" icon={Users} label="Dipendenti" />
    <SidebarNavLink to="/statistics" icon={LineChart} label="Statistiche" />
    
    {/* Esempio di link con badge (se necessario) */}
    {/*
    <NavLink
      to="#"
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
    >
      <Bell className="h-4 w-4" />
      Notifiche
      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
        6
      </Badge>
    </NavLink>
    */}
  </nav>
);

// Componente Sidebar principale
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* 1. Sidebar Desktop (Fissa) */}
      <div className="hidden border-r bg-muted/40 md:flex md:flex-col md:fixed md:inset-y-0 md:w-64">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">OrderMaster</span>
          </NavLink>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <NavigationContent />
        </div>
      </div>

      {/* 2. Sidebar Mobile (Sheet a scorrimento) */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="flex flex-col p-0">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold" onClick={onClose}>
              <Package2 className="h-6 w-6" />
              <span className="">OrderMaster</span>
            </NavLink>
          </div>
          <div className="flex-1 overflow-auto py-2" onClick={onClose}>
            <NavigationContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default Sidebar;
