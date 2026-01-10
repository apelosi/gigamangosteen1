import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import type { IStorage } from "./storage";
import type { ObjectMemory, InsertObjectMemory, UpdateObjectMemory } from "@shared/schema";
import { objectMemories } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

export class PostgresStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    const pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle(pool, { schema });
  }

  async getObjectMemory(id: string): Promise<ObjectMemory | undefined> {
    const result = await this.db.select().from(objectMemories).where(eq(objectMemories.id, id));
    return result[0];
  }

  async getObjectMemoriesBySession(sessionId: string): Promise<ObjectMemory[]> {
    const result = await this.db
      .select()
      .from(objectMemories)
      .where(eq(objectMemories.sessionId, sessionId))
      .orderBy(objectMemories.lastUpdated);
    return result.reverse(); // Most recent first
  }

  async getAllObjectMemories(): Promise<ObjectMemory[]> {
    const result = await this.db
      .select()
      .from(objectMemories)
      .orderBy(objectMemories.lastUpdated);
    return result.reverse(); // Most recent first
  }

  async createObjectMemory(insertMemory: InsertObjectMemory): Promise<ObjectMemory> {
    const result = await this.db.insert(objectMemories).values(insertMemory).returning();
    return result[0];
  }

  async updateObjectMemory(id: string, updateMemory: UpdateObjectMemory): Promise<ObjectMemory | undefined> {
    // Build the update object dynamically to only include fields that are defined
    const updateData: Record<string, any> = { lastUpdated: new Date() };
    if (updateMemory.userImageBase64 !== undefined) updateData.userImageBase64 = updateMemory.userImageBase64;
    if (updateMemory.objectImageBase64 !== undefined) updateData.objectImageBase64 = updateMemory.objectImageBase64;
    if (updateMemory.objectDescription !== undefined) updateData.objectDescription = updateMemory.objectDescription;
    if (updateMemory.objectMemory !== undefined) updateData.objectMemory = updateMemory.objectMemory;

    const result = await this.db
      .update(objectMemories)
      .set(updateData)
      .where(eq(objectMemories.id, id))
      .returning();
    return result[0];
  }
}
