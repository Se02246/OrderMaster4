import { Router } from 'express';
import { db } from './db';
import { apartments, employees, orders } from '../shared/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { getSignedUrl } from './storage';

// Deve usare "export const" per funzionare con l'index
export const apiRoutes = Router();

// Middleware per controllare se l'utente è autenticato
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ message: 'Non autorizzato' });
  }
  next();
};

// Applica il middleware a TUTTE le rotte API
apiRoutes.use(requireAuth);

// --- Rotte Dipendenti (Employees) ---
apiRoutes.get('/employees', async (req, res) => {
  const employeeList = await db.select().from(employees);
  res.json(employeeList);
});

apiRoutes.get('/employees/:id', async (req, res) => {
  const { id } = req.params;
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, Number(id)),
  });
  if (!employee) {
    return res.status(404).json({ message: 'Cliente non trovato' });
  }
  res.json(employee);
});

apiRoutes.post('/employees', async (req, res) => {
  try {
    const newEmployee = req.body;
    const inserted = await db.insert(employees).values(newEmployee).returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel creare il dipendente' });
  }
});

apiRoutes.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updated = await db
      .update(employees)
      .set(updatedData)
      .where(eq(employees.id, Number(id)))
      .returning();
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'aggiornare il dipendente' });
  }
});

apiRoutes.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(employees).where(eq(employees.id, Number(id)));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminare il dipendente' });
  }
});


// --- Rotte Ordini (Orders) ---
apiRoutes.get('/orders', async (req, res) => {
  const { start, end, employeeId } = req.query;

  let queryConditions = [];
  if (typeof start === 'string' && typeof end === 'string') {
    queryConditions.push(gte(orders.date, start));
    queryConditions.push(lte(orders.date, end));
  }
  if (typeof employeeId === 'string') {
    queryConditions.push(eq(orders.employeeId, Number(employeeId)));
  }

  try {
    const orderList = await db
      .select()
      .from(orders)
      .where(and(...queryConditions));
    res.json(orderList);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recuperare gli ordini' });
  }
});

apiRoutes.post('/orders', async (req, res) => {
  try {
    const newOrder = req.body;
    const insertedOrder = await db.insert(orders).values(newOrder).returning();
    res.status(201).json(insertedOrder[0]);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel creare l\'ordine' });
  }
});

apiRoutes.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrderData = req.body;
    const updatedOrder = await db
      .update(orders)
      .set(updatedOrderData)
      .where(eq(orders.id, Number(id)))
      .returning();
    res.json(updatedOrder[0]);
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'aggiornare l\'ordine' });
  }
});

apiRoutes.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(orders).where(eq(orders.id, Number(id)));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminare l\'ordine' });
  }
});


// --- Rotte Appartamenti (Apartments) ---
apiRoutes.get('/apartments', async (req, res) => {
  const apartmentList = await db.select().from(apartments);
  res.json(apartmentList);
});

apiRoutes.post('/apartments', async (req, res) => {
  try {
    const newApartment = req.body;
    const inserted = await db.insert(apartments).values(newApartment).returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel creare l\'appartamento' });
  }
});

apiRoutes.put('/apartments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updated = await db
      .update(apartments)
      .set(updatedData)
      .where(eq(apartments.id, Number(id)))
      .returning();
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'aggiornare l\'appartamento' });
  }
});


// --- Rotta Upload Immagine ---
apiRoutes.get('/upload-url', async (req, res) => {
  const { fileName, fileType } = req.query;
  if (typeof fileName !== 'string' || typeof fileType !== 'string') {
    return res.status(400).send('Parametri non validi');
  }
  try {
    const url = await getSignedUrl(fileName, fileType);
    res.json({ url });
  } catch (error) {
    console.error('Errore nel generare l\'URL di upload:', error);
    res.status(500).json({ message: 'Errore nel server' });
  }
});
