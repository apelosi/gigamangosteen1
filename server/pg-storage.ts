import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import type { IStorage } from "./storage";
import type { DiceRoll, InsertDiceRoll, UpdateDiceRoll } from "@shared/schema";
import { diceRolls } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

export class PostgresStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    const pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle(pool, { schema });
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
