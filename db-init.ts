// se02246/ordermaster4/OrderMaster4-impl_login/db-init.ts

import { sql } from 'drizzle-orm';
import { db } from './server/db';

async function main() {
  console.log('Inizializzazione database in corso...');

  // Drop tabelle se esistono (in ordine inverso per le foreign key)
  await db.execute(sql`DROP TABLE IF EXISTS "sessions" CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS assignments CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS orders CASCADE`); // NUOVO: Drop orders table
  await db.execute(sql`DROP TABLE IF EXISTS employees CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS apartments CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);

  // Crea tabella users
  console.log('Creazione tabella users...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      hashed_password TEXT NOT NULL
    )
  `);

  // Crea tabella apartments
  console.log('Creazione tabella apartments...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS apartments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cleaning_date VARCHAR(10) NOT NULL,
      start_time VARCHAR(5),
      status VARCHAR(20) NOT NULL DEFAULT 'Da Fare' CHECK (status IN ('Da Fare', 'In Corso', 'Fatto')),
      payment_status VARCHAR(20) NOT NULL DEFAULT 'Da Pagare' CHECK (payment_status IN ('Da Pagare', 'Pagato')),
      notes TEXT,
      price NUMERIC(10, 2),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      address VARCHAR(255) // NUOVO: Aggiungi campo address
    )
  `);

  // Crea tabella employees
  console.log('Creazione tabella employees...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255), // NUOVO: Campi aggiuntivi per coerenza con il front-end
      email VARCHAR(255),
      phone VARCHAR(20),
      address VARCHAR(255),
      image_url VARCHAR(255)
    )
  `);
  
  // Crea tabella orders
  console.log('Creazione tabella orders...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      date VARCHAR(10) NOT NULL,
      employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      apartment_id INTEGER REFERENCES apartments(id) ON DELETE SET NULL,
      details TEXT,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  // Crea tabella assignments
  console.log('Creazione tabella assignments...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(apartment_id, employee_id)
    )
  `);

  // Crea tabella sessions
// ... (resto del file invariato)
}

main().catch((error) => {
  console.error('Errore durante l\'inizializzazione del database:', error);
  process.exit(1);
});
