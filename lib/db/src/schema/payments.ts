import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { serviceRequestsTable } from "./requests";

export const paymentMethodEnum = pgEnum("payment_method", ["yape", "plin", "tarjeta"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pendiente", "completado", "fallido", "reembolsado"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => serviceRequestsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  metodoPago: paymentMethodEnum("metodo_pago").notNull(),
  status: paymentStatusEnum("status").notNull().default("pendiente"),
  referencia: text("referencia"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
