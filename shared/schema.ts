import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const diceRolls = pgTable("dice_rolls", {
  sessionId: varchar("session_id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
  rolls: text("rolls").notNull().default(""),
  sides: integer("sides"),
});

export const insertDiceRollSchema = createInsertSchema(diceRolls).pick({
  rolls: true,
  sides: true,
});

export const updateDiceRollSchema = z.object({
  rolls: z.string(),
  sides: z.number().int().min(6).max(24).optional(),
});

export type InsertDiceRoll = z.infer<typeof insertDiceRollSchema>;
export type UpdateDiceRoll = z.infer<typeof updateDiceRollSchema>;
export type DiceRoll = typeof diceRolls.$inferSelect;
