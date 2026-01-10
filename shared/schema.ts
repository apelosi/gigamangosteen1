import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const objectMemories = pgTable("object_memories", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: varchar("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  lastUpdated: timestamp("last_updated").notNull().$defaultFn(() => new Date()),
  userImageBase64: text("user_image_base64"),
  objectImageBase64: text("object_image_base64"),
  objectDescription: text("object_description"),
  objectMemory: text("object_memory"),
});

export const insertObjectMemorySchema = createInsertSchema(objectMemories).pick({
  sessionId: true,
  userImageBase64: true,
});

export const updateObjectMemorySchema = z.object({
  userImageBase64: z.string().optional(),
  objectImageBase64: z.string().optional(),
  objectDescription: z.string().optional(),
  objectMemory: z.string().optional(),
});

export type InsertObjectMemory = z.infer<typeof insertObjectMemorySchema>;
export type UpdateObjectMemory = z.infer<typeof updateObjectMemorySchema>;
export type ObjectMemory = typeof objectMemories.$inferSelect;
