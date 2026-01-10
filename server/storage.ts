import { type ObjectMemory, type InsertObjectMemory, type UpdateObjectMemory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Object Memory methods
  getObjectMemory(id: string): Promise<ObjectMemory | undefined>;
  getObjectMemoriesBySession(sessionId: string): Promise<ObjectMemory[]>;
  getAllObjectMemories(): Promise<ObjectMemory[]>;
  createObjectMemory(memory: InsertObjectMemory): Promise<ObjectMemory>;
  updateObjectMemory(id: string, memory: UpdateObjectMemory): Promise<ObjectMemory | undefined>;
}

export class MemStorage implements IStorage {
  private objectMemories: Map<string, ObjectMemory>;

  constructor() {
    this.objectMemories = new Map();
  }

  async getObjectMemory(id: string): Promise<ObjectMemory | undefined> {
    return this.objectMemories.get(id);
  }

  async getObjectMemoriesBySession(sessionId: string): Promise<ObjectMemory[]> {
    return Array.from(this.objectMemories.values())
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  async getAllObjectMemories(): Promise<ObjectMemory[]> {
    return Array.from(this.objectMemories.values()).sort((a, b) =>
      b.lastUpdated.getTime() - a.lastUpdated.getTime()
    );
  }

  async createObjectMemory(insertMemory: InsertObjectMemory): Promise<ObjectMemory> {
    const id = randomUUID();
    const sessionId = insertMemory.sessionId;
    const now = new Date();
    const objectMemory: ObjectMemory = {
      id,
      sessionId,
      createdAt: now,
      lastUpdated: now,
      userImageBase64: insertMemory.userImageBase64 || null,
      objectImageBase64: null,
      objectDescription: null,
      objectMemory: null,
    };
    this.objectMemories.set(id, objectMemory);
    return objectMemory;
  }

  async updateObjectMemory(id: string, updateMemory: UpdateObjectMemory): Promise<ObjectMemory | undefined> {
    const existing = this.objectMemories.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: ObjectMemory = {
      ...existing,
      userImageBase64: updateMemory.userImageBase64 !== undefined ? updateMemory.userImageBase64 : existing.userImageBase64,
      objectImageBase64: updateMemory.objectImageBase64 !== undefined ? updateMemory.objectImageBase64 : existing.objectImageBase64,
      objectDescription: updateMemory.objectDescription !== undefined ? updateMemory.objectDescription : existing.objectDescription,
      objectMemory: updateMemory.objectMemory !== undefined ? updateMemory.objectMemory : existing.objectMemory,
      lastUpdated: new Date(),
    };
    this.objectMemories.set(id, updated);
    return updated;
  }
}

// Use PostgreSQL storage if NETLIFY_DATABASE_URL is set, otherwise use MemStorage
let storageInstance: IStorage | null = null;

async function initializeStorage(): Promise<IStorage> {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL;

  if (databaseUrl) {
    const { PostgresStorage } = await import("./pg-storage.js");
    return new PostgresStorage(databaseUrl);
  }

  return new MemStorage();
}

export async function getStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await initializeStorage();
  }
  return storageInstance;
}
