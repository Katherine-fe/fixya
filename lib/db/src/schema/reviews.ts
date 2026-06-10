import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { techniciansTable } from "./technicians";
import { serviceRequestsTable } from "./requests";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => serviceRequestsTable.id).unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id),
  calificacion: integer("calificacion").notNull(),
  comentario: text("comentario"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
