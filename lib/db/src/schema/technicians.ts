import { pgTable, text, serial, timestamp, boolean, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { servicesTable } from "./services";

export const technicianStatusEnum = pgEnum("technician_status", ["pendiente", "aprobado", "rechazado", "suspendido"]);

export const techniciansTable = pgTable("technicians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id),
  especialidad: text("especialidad").notNull(),
  descripcion: text("descripcion"),
  experienciaAnios: integer("experiencia_anios").notNull().default(0),
  precioHora: numeric("precio_hora", { precision: 10, scale: 2 }).notNull().default("0"),
  disponible: boolean("disponible").notNull().default(true),
  status: technicianStatusEnum("status").notNull().default("pendiente"),
  promedioCalificacion: numeric("promedio_calificacion", { precision: 3, scale: 2 }).notNull().default("0"),
  totalTrabajos: integer("total_trabajos").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTechnicianSchema = createInsertSchema(techniciansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof techniciansTable.$inferSelect;
