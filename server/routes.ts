import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { authMiddleware } from "./middleware";
import type { InsertApartment, InsertEmployee } from "@shared/schema";
// === INIZIO MODIFICA ===
import { format } from "date-fns";
// === FINE MODIFICA ===


const router = Router();

// Auth routes
// (Auth routes... /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout)
// ... (le tue rotte di autenticazione restano invariate) ...

// Apartments
// (Apartment routes... /api/apartments, /api/apartments/:id)
// ... (le tue rotte per gli appartamenti restano invariate) ...

// Employees
// (Employee routes... /api/employees, /api/employees/:id)
// ... (le tue rotte per i dipendenti restano invariate) ...

// Calendar
// (Calendar routes... /api/calendar/month, /api/calendar/date)
// ... (le tue rotte per il calendario restano invariate) ...


// === INIZIO MODIFICA ===
// Statistics
router.get("/api/statistics", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    // Leggi i parametri dalla query string
    // Default: l'anno corrente
    const year = req.query.year 
      ? parseInt(req.query.year as string, 10) 
      : new Date().getFullYear();
    
    // Default: il mese corrente (formato "YYYY-MM")
    const monthYear = req.query.monthYear 
      ? (req.query.monthYear as string) 
      : format(new Date(), "yyyy-MM");

    const stats = await storage.getStatistics(userId, { year, monthYear });
    res.json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
});
// === FINE MODIFICA ===


export default router;
