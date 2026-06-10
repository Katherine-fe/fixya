import { pgTable, text, serial, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["usuario", "tecnico", "administrador"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  passwordHash: text("password_hash"),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull().default(""),
  email: text("email").notNull().unique(),
  telefono: text("telefono"),
  direccion: text("direccion"),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").notNull().default("usuario"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
