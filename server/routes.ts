import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertApartmentSchema,
  insertEmployeeSchema,
  apartmentWithEmployeesSchema,
  insertUserSchema,
  SafeUser,
  users,
  apartments, // <-- AGGIUNTO
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { isAuthenticated } from "./middleware"; // Import corretto
import passport from "passport";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm"; // <-- AGGIUNTI 'and' e 'sql'
// === INIZIO MODIFICA ===
// Import necessario per i valori di default e per il parsing della data
import { format, parse } from "date-fns";
// === FINE MODIFICA ===

// Helper per ottenere l'ID utente in modo sicuro
function getUserId(req: Request): number {
  const user = req.user as SafeUser;
  if (!user || !user.id) {
    throw new Error("Autenticazione richiesta");
  }
  return user.id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Struttura corretta
  const router = express.Router();
  const authRouter = express.Router();

  // === Route di Autenticazione (Pubbliche) ===
  // ... (Tutto il codice di authRouter rimane invariato)
  authRouter.post(
    "/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res
            .status(400)
            .json({ message: "Email e password sono obbligatori." });
        }

        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (existingUser) {
          return res.status(400).json({ message: "Email già registrata." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const validationResult = insertUserSchema.safeParse({
          email,
          hashed_password: hashedPassword,
        });

        if (!validationResult.success) {
          const errorMessage = fromZodError(validationResult.error).message;
          return res.status(400).json({ message: errorMessage });
        }

        const [newUser] = await db
          .insert(users)
          .values(validationResult.data)
          .returning();
        const { hashed_password, ...safeUser } = newUser;

        req.login(safeUser, (err) => {
          if (err) return next(err);
          res.status(201).json(safeUser);
        });
      } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Error registering user" });
      }
    }
  );

  authRouter.post(
    "/login",
    passport.authenticate("local"),
    (req: Request, res: Response) => {
      res.json(req.user);
    }
  );

  authRouter.post(
    "/logout",
    (req: Request, res: Response, next: NextFunction) => {
      req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
          res.clearCookie("connect.sid");
          res.status(200).json({ message: "Logout effettuato con successo." });
        });
      });
    }
  );

  authRouter.get("/me", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Non autenticato" });
    }
  });

  app.use("/api/auth", authRouter);

  // === Route API Protette ===
  router.use(isAuthenticated); // Uso corretto del middleware

  // Apartments endpoints
  // ... (Tutte le rotte /apartments rimangono invariate)
  router.get("/apartments", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const sortBy = req.query.sortBy as string | undefined;
      const search = req.query.search as string | undefined;

      const apartments = await storage.getApartments(userId, { sortBy, search });
      res.json(apartments);
    } catch (error) {
      console.error("Error fetching apartments:", error);
      res.status(500).json({ message: "Error fetching apartments" });
    }
  });

  // === NUOVA ROTTA PER AGGIORNAMENTO MASSIVO ===
  router.patch("/apartments/bulk-complete", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      await storage.markAllPastOrdersCompleted(userId);
      res.json({ message: "Ordini aggiornati con successo." });
    } catch (error) {
      console.error("Error bulk completing orders:", error);
      res.status(500).json({ message: "Error bulk completing orders" });
    }
  });
  // === FINE NUOVA ROTTA ===

  // === INIZIO CORREZIONE: ROTTA MANCANTE PER ERRORE JSON ===
  // Aggiungiamo la rotta /api/apartments/date/:date
  router.get("/apartments/date/:date", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const dateString = req.params.date; // es: "2025-11-04"

      // Usiamo 'parse' per convertire la stringa in un oggetto Date
      const parsedDate = parse(dateString, "yyyy-MM-dd", new Date());

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Data non valida" });
      }

      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth() + 1; // getMonth() è 0-indexed
      const day = parsedDate.getDate();

      // Chiamiamo la funzione storage esistente con i parametri corretti
      const apartments = await storage.getApartmentsByDate(
        userId,
        year,
        month,
        day
      );
      res.json(apartments);
    } catch (error) {
      console.error("Error fetching calendar day data by date:", error);
      res.status(500).json({ message: "Error fetching calendar day data" });
    }
  });
  // === FINE CORREZIONE ===

  router.get("/apartments/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid apartment ID" });
      }

      const apartment = await storage.getApartment(userId, id);
      if (!apartment) {
        return res.status(404).json({ message: "Apartment not found" });
      }

      res.json(apartment);
    } catch (error) {
      console.error("Error fetching apartment:", error);
      res.status(500).json({ message: "Error fetching apartment" });
    }
  });

  router.post("/apartments", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const validationResult = apartmentWithEmployeesSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res
          .status(400)
          .json({ message: errorMessage || "Dati non validi." });
      }

      const { employee_ids, ...apartmentData } = validationResult.data;

      const apartment = await storage.createApartment(
        userId,
        { ...apartmentData, user_id: userId },
        employee_ids || []
      );

      res.status(201).json(apartment);
    } catch (error) {
      console.error("Error creating apartment:", error);
      res.status(500).json({ message: "Error creating apartment" });
    }
  });

  router.put("/apartments/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid apartment ID" });
      }

      const validationResult = apartmentWithEmployeesSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res
          .status(400)
          .json({ message: errorMessage || "Dati non validi." });
      }

      const { employee_ids, ...apartmentData } = validationResult.data;

      const apartment = await storage.updateApartment(
        userId,
        id,
        { ...apartmentData, user_id: userId },
        employee_ids || []
      );

      res.json(apartment);
    } catch (error) {
      console.error("Error updating apartment:", error);
      res.status(500).json({ message: "Error updating apartment" });
    }
  });

  router.delete("/apartments/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid apartment ID" });
      }

      await storage.deleteApartment(userId, id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting apartment:", error);
      res.status(500).json({ message: "Error deleting apartment" });
    }
  });

  // === INIZIO AGGIUNTA: TOGGLE PREFERITO ===
  router.patch(
    "/apartments/:id/toggle-favorite",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
          return res.status(400).json({ message: "ID non valido" });
        }

        // 1. Verifica che l'appartamento esista e appartenga all'utente
        const [existing] = await db
          .select({ id: apartments.id })
          .from(apartments)
          .where(and(eq(apartments.id, id), eq(apartments.user_id, userId)))
          .limit(1);

        if (!existing) {
          return res.status(404).json({ message: "Ordine non trovato" });
        }

        // 2. Inverte il valore booleano 'is_favorite'
        const [updatedApartment] = await db
          .update(apartments)
          .set({
            is_favorite: sql`NOT ${apartments.is_favorite}`,
          })
          .where(eq(apartments.id, id)) // Non serve più il check dell'utente, l'abbiamo fatto sopra
          .returning({
            id: apartments.id,
            is_favorite: apartments.is_favorite,
          });

        res.json(updatedApartment);
      } catch (error) {
        console.error(
          "Errore durante l'aggiornamento del preferito:",
          error
        );
        res
          .status(500)
          .json({ message: "Errore durante l'aggiornamento del preferito" });
      }
    }
  );
  // === FINE AGGIUNTA ===

  // Employees endpoints
  // ... (Tutte le rotte /employees rimangono invariate)
  router.get("/employees", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const search = req.query.search as string | undefined;

      const employees = await storage.getEmployees(userId, { search });
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Error fetching employees" });
    }
  });

  router.get("/employees/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      const employee = await storage.getEmployee(userId, id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Error fetching employee" });
    }
  });

  router.post("/employees", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const validationResult = insertEmployeeSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res
          .status(400)
          .json({ message: errorMessage || "Dati non validi." });
      }

      const employee = await storage.createEmployee(userId, {
        ...validationResult.data,
        user_id: userId,
      });

      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Error creating employee" });
    }
  });

  router.delete("/employees/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      await storage.deleteEmployee(userId, id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Error deleting employee" });
    }
  });

  // Calendar endpoints
  // ... (Tutte le rotte /calendar rimangono invariate)
  router.get("/calendar/:year/:month", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }

      const apartments = await storage.getApartmentsByMonth(userId, year, month);
      res.json(apartments);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      res.status(500).json({ message: "Error fetching calendar data" });
    }
  });

  // Questa rotta rimane, serve per altre parti (se ci sono)
  router.get(
    "/calendar/:year/:month/:day",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const day = parseInt(req.params.day);

        if (
          isNaN(year) ||
          isNaN(month) ||
          isNaN(day) ||
          month < 1 ||
          month > 12 ||
          day < 1 ||
          day > 31
        ) {
          return res.status(400).json({ message: "Invalid date" });
        }

        const apartments = await storage.getApartmentsByDate(
          userId,
          year,
          month,
          day
        );
        res.json(apartments);
      } catch (error) {
        console.error("Error fetching calendar day data:", error);
        res.status(500).json({ message: "Error fetching calendar day data" });
      }
    }
  );

  // === INIZIO MODIFICA ===
  // Statistics endpoint
  router.get("/statistics", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Leggi i parametri dalla query string
      // Default: l'anno corrente
      const year = req.query.year
        ? parseInt(req.query.year as string, 10)
        : new Date().getFullYear();

      // Default: il mese corrente (formato "YYYY-MM")
      const monthYear = req.query.monthYear
        ? (req.query.monthYear as string)
        : format(new Date(), "yyyy-MM");

      // Passa le opzioni a storage.getStatistics
      const stats = await storage.getStatistics(userId, { year, monthYear });

      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Error fetching statistics" });
    }
  });
  // === FINE MODIFICA ===

  // Register the API routes
  app.use("/api", router);

  const httpServer = createServer(app);

  return httpServer;
}
