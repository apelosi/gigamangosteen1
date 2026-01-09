import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const diceRolls = pgTable("dice_rolls", {
  sessionId: varchar("session_id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  lastUpdated: timestamp("last_updated").notNull().$defaultFn(() => new Date()),
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
