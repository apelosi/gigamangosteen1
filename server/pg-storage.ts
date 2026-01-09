import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import type { IStorage } from "./storage";
import type { User, InsertUser, DiceRoll, InsertDiceRoll, UpdateDiceRoll } from "@shared/schema";
import { users, diceRolls } from "@shared/schema";
import { eq } from "drizzle-orm";

export class PostgresStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    const sql = neon(databaseUrl);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getDiceRoll(sessionId: string): Promise<DiceRoll | undefined> {
    const result = await this.db.select().from(diceRolls).where(eq(diceRolls.sessionId, sessionId));
    return result[0];
  }

  async createDiceRoll(insertDiceRoll: InsertDiceRoll): Promise<DiceRoll> {
    const result = await this.db.insert(diceRolls).values(insertDiceRoll).returning();
    return result[0];
  }

  async updateDiceRoll(sessionId: string, updateDiceRoll: UpdateDiceRoll): Promise<DiceRoll | undefined> {
    const result = await this.db
      .update(diceRolls)
      .set({
        rolls: updateDiceRoll.rolls,
        sides: updateDiceRoll.sides,
        lastUpdated: new Date(),
      })
      .where(eq(diceRolls.sessionId, sessionId))
      .returning();
    return result[0];
  }
}
