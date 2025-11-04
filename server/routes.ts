import express from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, apartments, employees, apartmentsToEmployees } from "../shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
// === INIZIO CORREZIONE ===
import { eq, desc } from "drizzle-orm"; // Aggiunto 'eq'
// === FINE CORREZIONE ===
import { apartmentWithEmployeesSchema, employeeSchema } from "../shared/schema";
import { isAuthenticated, formatZodError } from "./middleware";

export const routes = express.Router();

// --- Auth Routes ---

routes.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful", user: req.user });
});

routes.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to destroy session" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout successful" });
    });
  });
});

routes.get("/me", (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// --- Apartments (Ordini) ---

// GET tutti gli ordini
routes.get("/apartments", isAuthenticated, async (req, res) => {
  try {
    const apartmentsData = await db.query.apartments.findMany({
      with: {
        employees: {
          with: {
            employee: true,
          },
        },
      },
      orderBy: (apartments, { asc }) => [asc(apartments.cleaning_date)],
    });

    // Trasforma i dati per nidificare i dipendenti
    const transformedApartments = apartmentsData.map((apt) => ({
      ...apt,
      employees: apt.employees.map((ae) => ae.employee),
    }));

    res.json(transformedApartments);
  } catch (error) {
    console.error("Errore nel recuperare gli ordini:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// === INIZIO CORREZIONE: ROTTA MANCANTE ===
// GET ordini per data specifica (per la pagina calendar-day)
routes.get("/apartments/date/:date", isAuthenticated, async (req, res) => {
  const { date } = req.params;

  if (!date) {
    return res.status(400).json({ message: "Data non fornita" });
  }

  try {
    const apartmentsData = await db.query.apartments.findMany({
      // Filtra per data di pulizia
      where: eq(apartments.cleaning_date, date),
      with: {
        employees: {
          with: {
            employee: true,
          },
        },
      },
      orderBy: (apartments, { asc }) => [asc(apartments.start_time)], // Ordina per ora
    });

    // Stessa trasformazione dati delle altre routes
    const transformedApartments = apartmentsData.map((apt) => ({
      ...apt,
      employees: apt.employees.map((ae) => ae.employee),
    }));

    res.json(transformedApartments);
  } catch (error) {
    console.error("Errore nel recuperare gli ordini per data:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});
// === FINE CORREZIONE ===

// GET ordine singolo
routes.get("/apartments/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const apartmentData = await db.query.apartments.findFirst({
      where: eq(apartments.id, Number(id)),
      with: {
        employees: {
          with: {
            employee: true,
          },
        },
      },
    });

    if (!apartmentData) {
      return res.status(404).json({ message: "Ordine non trovato" });
    }

    // Trasforma i dati
    const transformedApartment = {
      ...apartmentData,
      employees: apartmentData.employees.map((ae) => ae.employee),
    };

    res.json(transformedApartment);
  } catch (error) {
    console.error("Errore nel recuperare l'ordine:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// POST (Crea) nuovo ordine
routes.post("/apartments", isAuthenticated, async (req, res) => {
  try {
    const validation = apartmentWithEmployeesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatZodError(validation.error));
    }

    const { employee_ids, ...apartmentData } = validation.data;

    // 1. Crea l'appartamento
    const [newApartment] = await db
      .insert(apartments)
      .values(apartmentData)
      .returning();

    // 2. Associa i dipendenti
    if (employee_ids && employee_ids.length > 0) {
      const links = employee_ids.map((empId) => ({
        apartmentId: newApartment.id,
        employeeId: empId,
      }));
      await db.insert(apartmentsToEmployees).values(links);
    }

    res.status(201).json(newApartment);
  } catch (error) {
    console.error("Errore nella creazione dell'ordine:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// PUT (Aggiorna) ordine
routes.put("/apartments/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const validation = apartmentWithEmployeesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatZodError(validation.error));
    }

    const { employee_ids, ...apartmentData } = validation.data;

    // 1. Aggiorna l'appartamento
    const [updatedApartment] = await db
      .update(apartments)
      .set(apartmentData)
      .where(eq(apartments.id, Number(id)))
      .returning();

    if (!updatedApartment) {
      return res.status(404).json({ message: "Ordine non trovato" });
    }

    // 2. Aggiorna le associazioni dei dipendenti (rimuovi vecchie, aggiungi nuove)
    await db
      .delete(apartmentsToEmployees)
      .where(eq(apartmentsToEmployees.apartmentId, Number(id)));

    if (employee_ids && employee_ids.length > 0) {
      const links = employee_ids.map((empId) => ({
        apartmentId: updatedApartment.id,
        employeeId: empId,
      }));
      await db.insert(apartmentsToEmployees).values(links);
    }

    res.json(updatedApartment);
  } catch (error) {
    console.error("Errore nell'aggiornamento dell'ordine:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// DELETE ordine
routes.delete("/apartments/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Rimuovi associazioni
    await db
      .delete(apartmentsToEmployees)
      .where(eq(apartmentsToEmployees.apartmentId, Number(id)));

    // 2. Rimuovi appartamento
    const [deletedApartment] = await db
      .delete(apartments)
      .where(eq(apartments.id, Number(id)))
      .returning();

    if (!deletedApartment) {
      return res.status(404).json({ message: "Ordine non trovato" });
    }

    res.status(204).send(); // Successo, nessuna risposta
  } catch (error) {
    console.error("Errore nell'eliminazione dell'ordine:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// --- Employees (Clienti) ---

// GET tutti i dipendenti
routes.get("/employees", isAuthenticated, async (req, res) => {
  try {
    const allEmployees = await db.query.employees.findMany({
       orderBy: (employees, { asc }) => [asc(employees.first_name)],
    });
    res.json(allEmployees);
  } catch (error) {
    console.error("Errore nel recuperare i dipendenti:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// GET dipendente singolo (con i suoi ordini)
routes.get("/employees/:id", isAuthenticated, async (req, res) => {
   try {
    const { id } = req.params;
    const employeeData = await db.query.employees.findFirst({
      where: eq(employees.id, Number(id)),
      with: {
        apartments: {
          with: {
            apartment: true,
          },
        },
      },
    });

    if (!employeeData) {
      return res.status(404).json({ message: "Dipendente non trovato" });
    }

    // Trasforma i dati per includere solo gli appartamenti
    const transformedData = {
      ...employeeData,
      apartments: employeeData.apartments.map(a => a.apartment)
    };
    
    res.json(transformedData);
  } catch (error) {
    console.error("Errore nel recuperare il dipendente:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});


// POST (Crea) nuovo dipendente
routes.post("/employees", isAuthenticated, async (req, res) => {
  try {
    const validation = employeeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatZodError(validation.error));
    }

    const [newEmployee] = await db
      .insert(employees)
      .values(validation.data)
      .returning();
      
    res.status(201).json(newEmployee);
  } catch (error) {
     console.error("Errore nella creazione del dipendente:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// PUT (Aggiorna) dipendente
routes.put("/employees/:id", isAuthenticated, async (req, res) => {
   try {
    const { id } = req.params;
    const validation = employeeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatZodError(validation.error));
    }

    const [updatedEmployee] = await db
      .update(employees)
      .set(validation.data)
      .where(eq(employees.id, Number(id)))
      .returning();

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Dipendente non trovato" });
    }
    
    res.json(updatedEmployee);
  } catch (error) {
     console.error("Errore nell'aggiornamento del dipendente:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// DELETE dipendente
routes.delete("/employees/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Rimuovi associazioni
    await db
      .delete(apartmentsToEmployees)
      .where(eq(apartmentsToEmployees.employeeId, Number(id)));

    // 2. Rimuovi dipendente
    const [deletedEmployee] = await db
      .delete(employees)
      .where(eq(employees.id, Number(id)))
      .returning();

    if (!deletedEmployee) {
      return res.status(404).json({ message: "Dipendente non trovato" });
    }

    res.status(204).send(); // Successo
  } catch (error) {
    console.error("Errore nell'eliminazione del dipendente:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});


// --- Calendar ---

// GET dati calendario per mese/anno
routes.get("/calendar/:year/:month", isAuthenticated, async (req, res) => {
  const { year, month } = req.params;
  
  // Costruisci le date di inizio e fine mese
  const startDate = new Date(Number(year), Number(month) - 1, 1);
  const endDate = new Date(Number(year), Number(month), 0); // L'ultimo giorno del mese

  try {
     const apartmentsData = await db.query.apartments.findMany({
      where: (apartments, { gte, lte }) => [
        gte(apartments.cleaning_date, startDate.toISOString().split('T')[0]),
        lte(apartments.cleaning_date, endDate.toISOString().split('T')[0]),
      ],
      with: {
        employees: {
          with: {
            employee: true,
          },
        },
      },
    });
    
    // Trasforma i dati
    const transformedApartments = apartmentsData.map((apt) => ({
      ...apt,
      employees: apt.employees.map((ae) => ae.employee),
    }));

    res.json(transformedApartments);
  } catch (error) {
     console.error("Errore nel recuperare i dati del calendario:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});


// --- Statistics ---

routes.get("/statistics/summary", isAuthenticated, async (req, res) => {
  try {
    // 1. Totale ordini
    const totalOrders = await db.select({ count: (c) => c.count() }).from(apartments);
    
    // 2. Totale dipendenti
    const totalEmployees = await db.select({ count: (c) => c.count() }).from(employees);
    
    // 3. Ordini recenti (ultimi 5)
    const recentOrdersData = await db.query.apartments.findMany({
      limit: 5,
      orderBy: (apartments, { desc }) => [desc(apartments.cleaning_date), desc(apartments.id)],
      with: {
        employees: {
          with: {
            employee: true,
          },
        },
      },
    });
    
     const recentOrders = recentOrdersData.map((apt) => ({
      ...apt,
      employees: apt.employees.map((ae) => ae.employee),
    }));

    // 4. Calcolo entrate (potrebbe richiedere logica più complessa)
    // Semplice somma di tutti i prezzi
    const revenueResult = await db.select({ 
      total: (c) => c.sum(apartments.price) 
    }).from(apartments);
    
    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalOrders: totalOrders[0]?.count || 0,
      totalEmployees: totalEmployees[0]?.count || 0,
      totalRevenue: parseFloat(totalRevenue),
      recentOrders: recentOrders,
    });
    
  } catch (error) {
    console.error("Errore nel recuperare le statistiche:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
});
