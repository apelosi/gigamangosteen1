# Connecting to Neon DB

This guide explains how to connect this DiceForge application to Neon DB for persistent storage.

## Current Status

The app currently uses **MemStorage** (in-memory storage) which works perfectly for development but data is lost on server restart. To enable persistent storage with Neon DB:

## Setup Steps

### 1. Install Required Packages

```bash
npm install --save-dev @netlify/neon
npm install @neondatabase/serverless
```

### 2. Connect Netlify to Neon DB

```bash
# Initialize Neon database through Netlify
npx netlify db init

# This will:
# - Create a Neon project automatically
# - Link it to your Netlify site
# - Set NETLIFY_DATABASE_URL environment variable
```

### 3. Push Database Schema

```bash
# Push the Drizzle schema to Neon DB
npm run db:push
```

This will create the tables defined in `shared/schema.ts`:
- `users` table (for future authentication)
- `dice_rolls` table (for dice roll tracking)

### 4. Create PostgreSQL Storage Implementation

Create a new file `server/pg-storage.ts`:

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import type { IStorage } from "./storage";
import type { User, InsertUser, DiceRoll, InsertDiceRoll, UpdateDiceRoll } from "@shared/schema";
import { users, diceRolls } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

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
```

### 5. Update `server/storage.ts`

Replace the export at the bottom of the file:

```typescript
// Use PostgreSQL storage if DATABASE_URL is set, otherwise use MemStorage
export const storage = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
  ? await import("./pg-storage.js").then(
      (m) => new m.PostgresStorage(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL!)
    )
  : new MemStorage();
```

### 6. Set Environment Variables

**For Local Development:**
```bash
# Get the database URL from Netlify
npx netlify env:get NETLIFY_DATABASE_URL

# Add to .env file (create if it doesn't exist)
echo "DATABASE_URL=your_neon_connection_string" >> .env
```

**For Production:**
Already auto-configured by Netlify's Neon integration. The `NETLIFY_DATABASE_URL` environment variable is automatically set.

### 7. Update `.env` in `.gitignore`

Make sure `.env` is in your `.gitignore`:
```
.env
.env.local
```

## Testing

### Local Development with Neon DB

```bash
# Start dev server (will use Neon DB if DATABASE_URL is set)
npm run dev
```

### Local Development without Neon DB (MemStorage)

Just remove/comment out `DATABASE_URL` from `.env` and the app will use in-memory storage.

## Verifying Connection

After setting up Neon DB, you can verify the connection:

```bash
# Query the dice_rolls table directly
npx netlify db:query "SELECT * FROM dice_rolls LIMIT 5;"
```

## Current Implementation

The app currently works with MemStorage without any changes needed. When you're ready to persist data:

1. Follow steps 1-7 above
2. The app will automatically switch to PostgreSQL storage
3. All dice roll data will be persisted across server restarts

## Notes

- The schema is already defined in `shared/schema.ts`
- The API endpoints in `server/routes.ts` work with both storage implementations
- The frontend doesn't need any changes
- You can switch between MemStorage and PostgreSQL by setting/unsetting `DATABASE_URL`
