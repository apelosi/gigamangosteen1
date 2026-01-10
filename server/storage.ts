import { type Memory, type InsertMemory, type UpdateMemory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Memory methods
  getMemory(id: string): Promise<Memory | undefined>;
  getMemoriesBySession(sessionId: string): Promise<Memory[]>;
  getAllMemories(): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: string, memory: UpdateMemory): Promise<Memory | undefined>;
}

export class MemStorage implements IStorage {
  private memories: Map<string, Memory>;

  constructor() {
    this.memories = new Map();
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    return this.memories.get(id);
  }

  async getMemoriesBySession(sessionId: string): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  async getAllMemories(): Promise<Memory[]> {
    return Array.from(this.memories.values()).sort((a, b) =>
      b.lastUpdated.getTime() - a.lastUpdated.getTime()
    );
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const id = randomUUID();
    const sessionId = insertMemory.sessionId;
    const now = new Date();
    const memory: Memory = {
      id,
      sessionId,
      createdAt: now,
      lastUpdated: now,
      imageBase64: null,
      imageDescription: null,
      memory: null,
    };
    this.memories.set(id, memory);
    return memory;
  }

  async updateMemory(id: string, updateMemory: UpdateMemory): Promise<Memory | undefined> {
    const existing = this.memories.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Memory = {
      ...existing,
      imageBase64: updateMemory.imageBase64 !== undefined ? updateMemory.imageBase64 : existing.imageBase64,
      imageDescription: updateMemory.imageDescription !== undefined ? updateMemory.imageDescription : existing.imageDescription,
      memory: updateMemory.memory !== undefined ? updateMemory.memory : existing.memory,
      lastUpdated: new Date(),
    };
    this.memories.set(id, updated);
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
