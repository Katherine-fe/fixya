import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { serviceRequestsTable } from "./requests";
import { techniciansTable } from "./technicians";

export const offerStatusEnum = pgEnum("offer_status", ["pendiente", "aceptada", "rechazada"]);

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => serviceRequestsTable.id),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  comentario: text("comentario"),
  status: offerStatusEnum("status").notNull().default("pendiente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Offer = typeof offersTable.$inferSelect;
