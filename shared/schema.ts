import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const memories = pgTable("memories", {
  sessionId: varchar("session_id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  lastUpdated: timestamp("last_updated").notNull().$defaultFn(() => new Date()),
  imageBase64: text("image_base64"),
  imageDescription: text("image_description"),
  memory: text("memory"),
});

export const insertMemorySchema = createInsertSchema(memories).pick({
  sessionId: true,
});

export const updateMemorySchema = z.object({
  imageBase64: z.string().optional(),
  imageDescription: z.string().optional(),
  memory: z.string().optional(),
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type UpdateMemory = z.infer<typeof updateMemorySchema>;
export type Memory = typeof memories.$inferSelect;
