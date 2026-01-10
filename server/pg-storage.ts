import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import type { IStorage } from "./storage";
import type { Memory, InsertMemory, UpdateMemory } from "@shared/schema";
import { memories } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

export class PostgresStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    const pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle(pool, { schema });
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    const result = await this.db.select().from(memories).where(eq(memories.id, id));
    return result[0];
  }

  async getMemoriesBySession(sessionId: string): Promise<Memory[]> {
    const result = await this.db
      .select()
      .from(memories)
      .where(eq(memories.sessionId, sessionId))
      .orderBy(memories.lastUpdated);
    return result.reverse(); // Most recent first
  }

  async getAllMemories(): Promise<Memory[]> {
    const result = await this.db
      .select()
      .from(memories)
      .orderBy(memories.lastUpdated);
    return result.reverse(); // Most recent first
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const result = await this.db.insert(memories).values(insertMemory).returning();
    return result[0];
  }

  async updateMemory(id: string, updateMemory: UpdateMemory): Promise<Memory | undefined> {
    const result = await this.db
      .update(memories)
      .set({
        imageBase64: updateMemory.imageBase64,
        imageDescription: updateMemory.imageDescription,
        memory: updateMemory.memory,
        lastUpdated: new Date(),
      })
      .where(eq(memories.id, id))
      .returning();
    return result[0];
  }
}
