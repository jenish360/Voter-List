import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const people = pgTable("people", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  gender: text("gender").notNull().default("Male"),
  identity_number: text("identity_number"),
  order_number: text("order_number"),
  father_name: text("father_name"),
  age: integer("age"),
  house_name: text("house_name"),
  area: text("area"),
  ward_no: text("ward_no"),
  booth_no: text("booth_no"),
  phone: text("phone"),
  notes: text("notes"),
  is_marked: integer("is_marked").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
  user_id: true,
  created_at: true,
  is_marked: true,
});

export const updatePersonSchema = createInsertSchema(people).omit({
  id: true,
  user_id: true,
  created_at: true,
}).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Person = typeof people.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type UpdatePerson = z.infer<typeof updatePersonSchema>;
