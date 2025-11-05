import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
// === INIZIO MODIFICA ===
// Importa React per usare i Frammenti (<>...</>)
import React from "react";
// === FINE MODIFICA ===

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

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
    document.documentElement.style.setProperty("--primary", color);
    localStorage.setItem("themeColor", color);

    // Chiudi la sidebar su mobile dopo aver selezionato il colore
    handleLinkClick();
  };
  // === FINE MODIFICA TEMA ===

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
          </nav>

          {/* === INIZIO MODIFICA TEMA === */}
          {/* Sezione per cambiare il colore del tema */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 px-3">CAMBIA TEMA</h3>
            <div className="flex justify-around">
              <button
                onClick={() => handleChangeTheme("#3b82f6")} // Blu
                // CORREZIONE: Torniamo a usare le classi di Tailwind
                className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow hover:ring-2 hover:ring-blue-300 focus:outline-none"
                aria-label="Tema Blu"
              />
              <button
                onClick={() => handleChangeTheme("#ef4444")} // Rosso
                // CORREZIONE: Torniamo a usare le classi di Tailwind
                className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow hover:ring-2 hover:ring-red-300 focus:outline-none"
                aria-label="Tema Rosso"
              />
              <button
                onClick={() => handleChangeTheme("#22c55e")} // Verde
                // CORREZIONE: Torniamo a usare le classi di Tailwind
                className="w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow hover:ring-2 hover:ring-green-300 focus:outline-none"
                aria-label="Tema Verde"
              />
              <button
                onClick={() => handleChangeTheme("#f97316")} // Arancione
                // CORREZIONE: Torniamo a usare le classi di Tailwind
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
    </>
  );
  // === FINE MODIFICA ===
}
