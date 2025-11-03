import { Hono } from 'hono';
import { handle } from 'hono/node-server';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from './db.js'; // 🚨 CORREZIONE: Aggiunto .js
import * as schema from '../shared/schema.js'; // 🚨 CORREZIONE: Aggiunto .js
import { eq } from 'drizzle-orm';
import { clerkAuthMiddleware, getAuth } from './middleware.js'; // 🚨 CORREZIONE: Aggiunto .js

export const app = new Hono()
  .use(clerkAuthMiddleware())
  .get('/test', getAuth(), (c) => {
    const user = c.get('user');
    return c.json({
      message: 'Sei autenticato!',
      userId: user?.clerkId,
      userName: user?.name,
      userRole: user?.role,
    });
  })
  .get('/apartments', async (c) => {
    const apartments = await db.query.apartments.findMany();
    return c.json(apartments);
  })
  .post(
    '/apartments',
    zValidator(
      'json',
      schema.insertApartmentSchema.pick({ name: true, address: true })
    ),
    async (c) => {
      const apartmentData = c.req.valid('json');
      const newApartment = await db
        .insert(schema.apartments)
        .values(apartmentData)
        .returning();
      return c.json(newApartment[0], 201);
    }
  );
// Aggiungi altre rotte...
