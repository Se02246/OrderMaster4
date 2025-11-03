import { eq, and, like, or, inArray, desc, asc, sql, count } from "drizzle-orm";
import { db } from "./db";
// Aggiunti import da date-fns
import { getDaysInMonth, format, parse } from "date-fns"; // Aggiunto 'parse'

import {
  apartments,
  employees,
  assignments,
  type Apartment,
  type InsertApartment,
  type Employee,
  type InsertEmployee,
  type Assignment,
  type InsertAssignment,
  type ApartmentWithAssignedEmployees,
  type EmployeeWithAssignedApartments,
} from "@shared/schema";

// Definiamo i nuovi tipi per le statistiche
type TopEmployee = {
  name: string;
  count: number;
};
type ProductiveDay = {
  date: string;
  count: number;
};
type OrdersByTime = {
  day?: string;
  month?: string;
  count: number;
};
type MostProductiveMonth = {
  month: string;
  count: number;
};
type StatisticsData = {
  totalOrders: number;
  topEmployees: TopEmployee[];
  busiestDays: ProductiveDay[];
  ordersPerDayInMonth: OrdersByTime[];
  ordersPerMonthInYear: OrdersByTime[];
  mostProductiveMonth: MostProductiveMonth;
};

// === INIZIO MODIFICA ===
// Tipo per le opzioni delle statistiche
type StatisticsOptions = {
  year: number;       // Anno per il grafico mensile (es. 2024)
  monthYear: string;  // Mese per il grafico giornaliero (es. "2024-11")
};
// === FINE MODIFICA ===

export interface IStorage {
  // Apartment operations
  getApartments(userId: number, options?: { sortBy?: string; search?: string }): Promise<ApartmentWithAssignedEmployees[]>;
  getApartment(userId: number, id: number): Promise<ApartmentWithAssignedEmployees | undefined>;
  createApartment(userId: number, apartment: InsertApartment, employeeIds?: number[]): Promise<ApartmentWithAssignedEmployees>;
  updateApartment(userId: number, id: number, apartment: InsertApartment, employeeIds?: number[]): Promise<ApartmentWithAssignedEmployees>;
  deleteApartment(userId: number, id: number): Promise<void>;

  // Employee operations
  getEmployees(userId: number, options?: { search?: string }): Promise<EmployeeWithAssignedApartments[]>;
  getEmployee(userId: number, id: number): Promise<EmployeeWithAssignedEmployees | undefined>;
  createEmployee(userId: number, employee: InsertEmployee): Promise<Employee>;
  deleteEmployee(userId: number, id: number): Promise<void>;

  // Calendar operations
  getApartmentsByMonth(userId: number, year: number, month: number): Promise<ApartmentWithAssignedEmployees[]>;
  getApartmentsByDate(userId: number, year: number, month: number, day: number): Promise<ApartmentWithAssignedEmployees[]>;

  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  deleteAssignmentsByApartment(apartmentId: number): Promise<void>;

  // === INIZIO MODIFICA ===
  // Modificato il tipo di ritorno
  getStatistics(userId: number, options: StatisticsOptions): Promise<StatisticsData>;
  // === FINE MODIFICA ===
}

export class DatabaseStorage implements IStorage {
  // ... (tutte le altre funzioni da riga 112 a 287 restano invariate) ...
  // ... getEmployeesForApartment ...
  // ... getApartmentsForEmployee ...
  // ... getApartments ...
  // ... getApartment ...
  // ... createApartment ...
  // ... updateApartment ...
  // ... deleteApartment ...
  // ... getEmployees ...
  // ... getEmployee ...
  // ... createEmployee ...
  // ... deleteEmployee ...
  // ... getApartmentsByMonth ...
  // ... getApartmentsByDate ...
  // ... createAssignment ...
  // ... deleteAssignmentsByApartment ...
  
  // === INIZIO MODIFICA ===
  async getStatistics(userId: number, options: StatisticsOptions): Promise<StatisticsData> {
    // 1. Ordini totali (Invariato)
    const [totalOrdersResult] = await db.select({
      value: count()
    }).from(apartments)
    .where(eq(apartments.user_id, userId));
    const totalOrders = totalOrdersResult.value;

    // 2. Top 3 Clienti (Invariato)
    const topEmployeesResult = await db
      .select({
        employee_id: assignments.employee_id,
        first_name: employees.first_name,
        last_name: employees.last_name,
        orderCount: count(assignments.apartment_id)
      })
      .from(assignments)
      .leftJoin(employees, eq(assignments.employee_id, employees.id))
      .where(eq(employees.user_id, userId)) // Filtra per utente
      .groupBy(assignments.employee_id, employees.first_name, employees.last_name)
      .orderBy(desc(sql`count(assignments.apartment_id)`))
      .limit(3);

    const topEmployees = topEmployeesResult.map(emp => ({
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      count: Number(emp.orderCount)
    }));

    // 3. Top 3 Giorni più produttivi (Invariato)
    const busiestDaysResult = await db
        .select({
            date: apartments.cleaning_date,
            count: count()
        })
        .from(apartments)
        .where(eq(apartments.user_id, userId)) // Filtra per utente
        .groupBy(apartments.cleaning_date)
        .orderBy(desc(count()))
        .limit(3);

    const busiestDays = busiestDaysResult.map(day => ({
        date: day.date,
        count: Number(day.count)
    }));

    // --- NUOVE STATISTICHE (Ora dinamiche) ---

    // 4. Ordini per Mese (Usa l'anno dalle opzioni)
    const selectedYear = options.year;
    const yearStart = `${selectedYear}-01-01`;
    const yearEnd = `${selectedYear}-12-31`;
    
    const monthSqlExpression = sql<string>`TO_CHAR(TO_DATE(${apartments.cleaning_date}, 'YYYY-MM-DD'), 'YYYY-MM')`;

    const monthQuery = await db
      .select({
        month_key: monthSqlExpression,
        count: count()
      })
      .from(apartments)
      .where(and(
        eq(apartments.user_id, userId),
        sql`${apartments.cleaning_date} >= ${yearStart}`,
        sql`${apartments.cleaning_date} <= ${yearEnd}`
      ))
      .groupBy(monthSqlExpression);

    // Crea un template per tutti i mesi dell'anno selezionato
    const monthsInYear = Array.from({ length: 12 }, (_, i) => 
      `${selectedYear}-${(i + 1).toString().padStart(2, '0')}`
    );
    
    const monthMap = new Map(monthQuery.map(m => [m.month_key, m.count]));
    
    const ordersPerMonthInYear = monthsInYear.map(month => ({
      month,
      count: Number(monthMap.get(month) || 0)
    }));

    // 5. Mese più produttivo (basato sull'anno selezionato)
    const mostProductiveMonth = ordersPerMonthInYear.reduce(
      (max, month) => month.count > max.count ? month : max, 
      ordersPerMonthInYear[0] || { month: format(new Date(selectedYear, 0, 1), "yyyy-MM"), count: 0 }
    );

    // 6. Ordini per Giorno (Usa il mese/anno dalle opzioni)
    // Esegui il parsing della stringa "YYYY-MM"
    const [yearForMonthChart, monthForMonthChart] = options.monthYear.split('-').map(Number);
    const dateForMonthChart = new Date(yearForMonthChart, monthForMonthChart - 1, 1);
    
    const daysInMonth = getDaysInMonth(dateForMonthChart);
    const monthStart = `${yearForMonthChart}-${monthForMonthChart.toString().padStart(2, '0')}-01`;
    const monthEnd = `${yearForMonthChart}-${monthForMonthChart.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

    const dayQuery = await db
      .select({
        date: apartments.cleaning_date,
        count: count()
      })
      .from(apartments)
      .where(and(
        eq(apartments.user_id, userId),
        sql`${apartments.cleaning_date} >= ${monthStart}`,
        sql`${apartments.cleaning_date} <= ${monthEnd}`
      ))
      .groupBy(apartments.cleaning_date);

    // Crea un template per tutti i giorni del mese selezionato
    const daysInMonthArray = Array.from({ length: daysInMonth }, (_, i) => 
      `${yearForMonthChart}-${monthForMonthChart.toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`
    );
    
    const dayMap = new Map(dayQuery.map(d => [d.date, d.count]));
    
    const ordersPerDayInMonth = daysInMonthArray.map(day => ({
      day,
      count: Number(dayMap.get(day) || 0)
    }));
    
    return {
      totalOrders,
      topEmployees,
      busiestDays,
      ordersPerDayInMonth,
      ordersPerMonthInYear,
      mostProductiveMonth
    };
  }
  // === FINE MODIFICA ===
}

export const storage = new DatabaseStorage();
