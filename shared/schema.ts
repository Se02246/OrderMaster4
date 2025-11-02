// se02246/ordermaster4/OrderMaster4-impl_login/shared/schema.ts

import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, primaryKey, timestamp, varchar, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// --- Tabelle ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashed_password: text("hashed_password").notNull(),
});
export const apartments = pgTable("apartments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cleaning_date: varchar("cleaning_date", { length: 10 }).notNull(), // format 'YYYY-MM-DD'
  start_time: varchar("start_time", { length: 5 }), // format 'HH:MM'
  status: varchar("status", { length: 20, enum: ["Da Fare", "In Corso", "Fatto"] }).notNull().default("Da Fare"),
  payment_status: varchar("payment_status", { length: 20, enum: ["Da Pagare", "Pagato"] }).notNull().default("Da Pagare"),
  notes: text("notes"),
  price: numeric("price", { precision: 10, scale: 2 }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // NUOVO: Aggiunto campo address usato nel front-end
  address: varchar("address", { length: 255 }), 
});
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // NUOVO: Aggiunti campi usati nel front-end
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: varchar("address", { length: 255 }),
  imageUrl: varchar("image_url", { length: 255 }),
});

// NUOVO: Tabella Ordini
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // format 'YYYY-MM-DD'
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }), // Link al Cliente
  apartmentId: integer("apartment_id").references(() => apartments.id, { onDelete: "set null" }), // Link all'Appartamento
  details: text("details"),
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false).notNull(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  apartment_id: integer("apartment_id").notNull().references(() => apartments.id, { onDelete: "cascade" }),
  employee_id: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    uniqueIdx: primaryKey({ columns: [table.apartment_id, table.employee_id] }),
  };
});

// --- Relazioni ---
export const usersRelations = relations(users, ({ many }) => ({
  apartments: many(apartments),
  employees: many(employees),
  orders: many(orders),
}));
export const apartmentsRelations = relations(apartments, ({ one, many }) => ({
  user: one(users, {
    fields: [apartments.user_id],
    references: [users.id],
  }),
  assignments: many(assignments),
  orders: many(orders), // NUOVO: Aggiungi relazione orders
}));
export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.user_id],
    references: [users.id],
  }),
  assignments: many(assignments),
  orders: many(orders), // NUOVO: Aggiungi relazione orders
}));
export const assignmentsRelations = relations(assignments, ({ one }) => ({
  apartment: one(apartments, {
    fields: [assignments.apartment_id],
    references: [apartments.id]
  }),
  employee: one(employees, {
    fields: [assignments.employee_id],
    references: [employees.id]
  })
}));
// NUOVO: Relazioni Orders
export const ordersRelations = relations(orders, ({ one }) => ({
  employee: one(employees, {
    fields: [orders.employeeId],
    references: [employees.id]
  }),
  apartment: one(apartments, {
    fields: [orders.apartmentId],
    references: [apartments.id]
  })
}));

// --- Schemi di Inserimento ---
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertApartmentSchema = createInsertSchema(apartments).omit({ id: true, user_id: true });
// Modifica per includere i campi extra per EmployeeModal
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, user_id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true }); // NUOVO

// --- Tipi ---
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Apartment = typeof apartments.$inferSelect;
export type InsertApartment = z.infer<typeof insertApartmentSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Order = typeof orders.$inferSelect; // NUOVO
export type InsertOrder = z.infer<typeof insertOrderSchema>; // NUOVO

// ... schemi estesi ...
export const apartmentWithEmployeesSchema = z.object({
// ... (il resto rimane invariato)
// ...
});
// ... (il resto rimane invariato)
