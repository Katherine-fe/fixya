import { pgTable, text, serial, timestamp, numeric, integer, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { techniciansTable } from "./technicians";
import { servicesTable } from "./services";

export const requestStatusEnum = pgEnum("request_status", ["pendiente", "aceptada", "en_progreso", "completada", "cancelada", "rechazada"]);

export const serviceRequestsTable = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  technicianId: integer("technician_id").references(() => techniciansTable.id),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id),
  descripcion: text("descripcion").notNull(),
  direccion: text("direccion").notNull(),
  fechaServicio: timestamp("fecha_servicio", { withTimezone: true }).notNull(),
  status: requestStatusEnum("status").notNull().default("pendiente"),
  precioAcordado: numeric("precio_acordado", { precision: 10, scale: 2 }),
  motivoCancelacion: text("motivo_cancelacion"),
  trackingStatus: varchar("tracking_status", { length: 30 }),
  etaMinutos: integer("eta_minutos"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequestsTable.$inferSelect;
