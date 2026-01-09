import { type User, type InsertUser, type DiceRoll, type InsertDiceRoll, type UpdateDiceRoll } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Dice roll methods
  getDiceRoll(sessionId: string): Promise<DiceRoll | undefined>;
  createDiceRoll(diceRoll: InsertDiceRoll): Promise<DiceRoll>;
  updateDiceRoll(sessionId: string, diceRoll: UpdateDiceRoll): Promise<DiceRoll | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private diceRolls: Map<string, DiceRoll>;

  constructor() {
    this.users = new Map();
    this.diceRolls = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDiceRoll(sessionId: string): Promise<DiceRoll | undefined> {
    return this.diceRolls.get(sessionId);
  }

  async createDiceRoll(insertDiceRoll: InsertDiceRoll): Promise<DiceRoll> {
    const sessionId = randomUUID();
    const now = new Date();
    const diceRoll: DiceRoll = {
      sessionId,
      createdAt: now,
      lastUpdated: now,
      rolls: insertDiceRoll.rolls || "",
      sides: insertDiceRoll.sides || null,
    };
    this.diceRolls.set(sessionId, diceRoll);
    return diceRoll;
  }

  async updateDiceRoll(sessionId: string, updateDiceRoll: UpdateDiceRoll): Promise<DiceRoll | undefined> {
    const existing = this.diceRolls.get(sessionId);
    if (!existing) {
      return undefined;
    }
    const updated: DiceRoll = {
      ...existing,
      rolls: updateDiceRoll.rolls,
      sides: updateDiceRoll.sides !== undefined ? updateDiceRoll.sides : existing.sides,
      lastUpdated: new Date(),
    };
    this.diceRolls.set(sessionId, updated);
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
