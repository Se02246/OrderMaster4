// --- MODIFICA ---
// Queste due righe caricano il file .env all'avvio
import dotenv from 'dotenv';
dotenv.config();
// --- FINE MODIFICA ---

import { db } from './server/db';
import { employees, apartments, assignments } from './shared/schema';
import fs from 'fs/promises';
import path from 'path';

// --- CONFIGURAZIONE ---
// ID dell'utente a cui associare tutti i dati importati
const USER_ID_TO_ASSIGN = 3;

// Nomi dei file JSON
const EMPLOYEE_FILE = 'lively-mode-04251080_main_neondb_2025-11-05_21-25-58.json';
const APARTMENT_FILE = 'lively-mode-04251080_main_neondb_2025-11-05_21-13-49.json';
const ASSIGNMENT_FILE = 'assignments.json';

// --- TIPI PER I VECCHI DATI ---
type OldEmployee = {
  id: number;
  first_name: string;
  last_name: string;
};

type OldApartment = {
  id: number;
  name: string;
  cleaning_date: string;
  start_time: string | null;
  status: "Da Fare" | "In Corso" | "Fatto";
  payment_status: "Da Pagare" | "Pagato";
  notes: string | null;
  price: string | number | null;
};

type OldAssignment = {
  id: number;
  apartment_id: number;
  employee_id: number;
};

// --- SCRIPT DI MIGRAZIONE ---
async function main() {
  console.log('--- Avvio script di migrazione ---');

  // Verifica l'utente
  console.log(`Assegnazione di tutti i dati all'utente con ID: ${USER_ID_TO_ASSIGN}`);

  // --- 0. Caricare i file JSON ---
  console.log('Caricamento file JSON...');
  const employeeData = JSON.parse(await fs.readFile(path.resolve(EMPLOYEE_FILE), 'utf-8')) as OldEmployee[];
  const apartmentData = JSON.parse(await fs.readFile(path.resolve(APARTMENT_FILE), 'utf-8')) as OldApartment[];
  const assignmentData = JSON.parse(await fs.readFile(path.resolve(ASSIGNMENT_FILE), 'utf-8')) as OldAssignment[];
  console.log(`Trovati: ${employeeData.length} clienti, ${apartmentData.length} ordini, ${assignmentData.length} assegnazioni.`);

  // Map per tenere traccia dei vecchi ID -> nuovi ID
  const employeeIdMap = new Map<number, number>();
  const apartmentIdMap = new Map<number, number>();

  // --- 1. Importare Employees (Clienti) ---
  console.log(`\nImportazione di ${employeeData.length} clienti...`);
  for (const oldEmp of employeeData) {
    try {
      const [newEmp] = await db.insert(employees).values({
        first_name: oldEmp.first_name.trim(),
        last_name: oldEmp.last_name.trim(),
        user_id: USER_ID_TO_ASSIGN
      }).returning({ id: employees.id });
      
      employeeIdMap.set(oldEmp.id, newEmp.id);
    } catch (err: any) {
      console.error(`Errore inserimento cliente ${oldEmp.first_name}:`, err.message);
    }
  }
  console.log(`Clienti importati. ${employeeIdMap.size} mappature ID create.`);

  // --- 2. Importare Apartments (Ordini) ---
  console.log(`\nImportazione di ${apartmentData.length} ordini...`);
  for (const oldApt of apartmentData) {
    try {
      // Pulisce i dati per il nuovo schema
      const newApartmentData = {
        name: oldApt.name.trim(),
        cleaning_date: oldApt.cleaning_date,
        start_time: oldApt.start_time || null, // Converte "" o undefined in null
        status: oldApt.status,
        payment_status: oldApt.payment_status,
        notes: oldApt.notes || null,
        price: oldApt.price ? String(oldApt.price) : null, // Converte in stringa per il tipo 'numeric'
        user_id: USER_ID_TO_ASSIGN,
        is_favorite: false // Valore di default
      };

      const [newApt] = await db.insert(apartments).values(newApartmentData).returning({ id: apartments.id });
      apartmentIdMap.set(oldApt.id, newApt.id);
    } catch (err: any) {
      console.error(`Errore inserimento ordine ${oldApt.name}:`, err.message);
    }
  }
  console.log(`Ordini importati. ${apartmentIdMap.size} mappature ID create.`);

  // --- 3. Importare Assignments (Assegnazioni) ---
  console.log(`\nImportazione di ${assignmentData.length} assegnazioni...`);
  let successCount = 0;
  let failCount = 0;
  for (const oldAssign of assignmentData) {
    const newEmployeeId = employeeIdMap.get(oldAssign.employee_id);
    const newApartmentId = apartmentIdMap.get(oldAssign.apartment_id);

    if (newEmployeeId && newApartmentId) {
      try {
        await db.insert(assignments).values({
          apartment_id: newApartmentId,
          employee_id: newEmployeeId
        });
        successCount++;
      } catch (err: any) {
        // Ignora errori di assegnazione duplicata (potrebbero esistere nel vecchio DB)
        if (err.code !== '23505') { // 23505 è il codice per "unique constraint violation"
          console.error(`Errore inserimento assegnazione (A:${newApartmentId}, E:${newEmployeeId}):`, err.message);
          failCount++;
        }
      }
    } else {
      console.warn(`Mappatura non trovata per assegnazione: AptID ${oldAssign.apartment_id} -> ${newApartmentId}, EmpID ${oldAssign.employee_id} -> ${newEmployeeId}`);
      failCount++;
    }
  }
  console.log(`Assegnazioni importate: ${successCount} successi, ${failCount} fallimenti.`);
  
  console.log('\n--- Migrazione completata! ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Errore fatale durante la migrazione:', err);
  process.exit(1);
});
