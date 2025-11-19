import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
// === INIZIO MODIFICA ===
// Importa React per usare i Frammenti (<>...</>) e useState
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCheck } from "lucide-react";
// === FINE MODIFICA ===

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  const menuItems = [
    {
      path: "/",
      label: "HOME",
      icon: "fa-home"
    },
    {
      path: "/calendar",
      label: "CALENDARIO",
      icon: "fa-calendar-alt"
    },
    {
      path: "/employees",
      label: "CLIENTI",
      icon: "fa-users"
    },
    {
      path: "/statistics",
      label: "STATISTICHE",
      icon: "fa-chart-pie"
    }
  ];

  const handleLinkClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  // === INIZIO MODIFICA TEMA ===
  // Funzione per cambiare il colore primario e salvarlo
  const handleChangeTheme = (color: string) => {
    // 'color' ora è una stringa HSL, es: "0 84% 60%"
    document.documentElement.style.setProperty("--primary", color);
    localStorage.setItem("themeColor", color);

    // Chiudi la sidebar su mobile dopo aver selezionato il colore
    handleLinkClick();
  };
  // === FINE MODIFICA TEMA ===

  // === INIZIO MODIFICA FUNZIONE COMPLETAMENTO ===
  const bulkCompleteMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/apartments/bulk-complete"),
    onSuccess: () => {
      toast({
        title: "Operazione completata",
        description: "Tutti gli ordini passati sono stati impostati come Fatti e Pagati.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      setIsConfirmOpen(false);
      handleLinkClick(); // Chiudi sidebar su mobile
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiornare gli ordini.",
        variant: "destructive",
      });
    }
  });

  const confirmBulkComplete = () => {
    bulkCompleteMutation.mutate();
  };
  // === FINE MODIFICA ===

  // === INIZIO MODIFICA ===
  // Usiamo un React.Fragment (<>) per includere sia la Sidebar che l'Overlay
  return (
    <>
      {/* Questo è il div della Sidebar (invariato) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 transform transition duration-200 ease-in-out bg-white shadow-lg z-30",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-2xl font-bold text-dark">GESTORE ORDINI</h1>
          </div>
          
          <nav className="flex-grow">
            <ul>
              {menuItems.map((item) => (
                <li key={item.path} className="mb-2">
                  <Link
                    href={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium hover:bg-gray-100",
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "text-dark"
                    )}
                  >
                    <i className={`fas ${item.icon} mr-3 text-lg`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* === TASTO COMPLETA TUTTO (AGGIORNATO) === */}
            <div className="mt-6 px-4">
               <button
                onClick={() => setIsConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-3 rounded-md transition-colors shadow-sm text-sm"
               >
                <CheckCheck size={16} />
                <span>COMPLETA TUTTO</span>
               </button>
            </div>

          </nav>

          {/* === INIZIO MODIFICA TEMA === */}
          {/* Sezione per cambiare il colore del tema */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 px-3">CAMBIA TEMA</h3>
            <div className="flex justify-around">
              <button
                // CORREZIONE: Passa i valori HSL per il Blu
                onClick={() => handleChangeTheme("221 83% 53%")} 
                // La classe 'bg-blue-500' serve solo per il pulsante stesso
                className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow hover:ring-2 hover:ring-blue-300 focus:outline-none"
                aria-label="Tema Blu"
              />
              <button
                // CORREZIONE: Passa i valori HSL per il Rosso
                onClick={() => handleChangeTheme("0 84% 60%")} 
                className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow hover:ring-2 hover:ring-red-300 focus:outline-none"
                aria-label="Tema Rosso"
              />
              <button
                // CORREZIONE: Passa i valori HSL per il Verde
                onClick={() => handleChangeTheme("145 63% 49%")} 
                className="w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow hover:ring-2 hover:ring-green-300 focus:outline-none"
                aria-label="Tema Verde"
              />
              <button
                // CORREZIONE: Passa i valori HSL per l'Arancione
                onClick={() => handleChangeTheme("25 95% 53%")} 
                className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white shadow hover:ring-2 hover:ring-orange-300 focus:outline-none"
                aria-label="Tema Arancione"
              />
            </div>
          </div>
          {/* === FINE MODIFICA TEMA === */}

        </div>
      </div>

      {/* NUOVO: Backdrop Overlay */}
      {/* Questo div appare solo se il menu è aperto (isOpen) */}
      {/* e scompare su schermi grandi (md:hidden) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose} // Chiama la funzione onClose quando cliccato
          aria-hidden="true"
        />
      )}

      {/* === ALERT DI CONFERMA (AGGIORNATO) === */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione imposterà come <strong>FATTO</strong> e <strong>PAGATO</strong> tutti gli ordini con data uguale o precedente a oggi.
              <br /><br />
              Questa operazione non può essere annullata facilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-red-600 hover:bg-red-700 text-white border-none">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkComplete} 
              className="bg-white text-black border border-gray-200 hover:bg-gray-100 shadow-sm"
            >
              Conferma e Completa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
  // === FINE MODIFICA ===
}
