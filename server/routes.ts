import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiceRollSchema, updateDiceRollSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dice roll endpoints

  // Create a new dice roll session
  app.post("/api/dice-rolls", async (req, res) => {
    try {
      const validatedData = insertDiceRollSchema.parse(req.body);
      const diceRoll = await storage.createDiceRoll(validatedData);
      res.status(201).json(diceRoll);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ message: fromError(error).toString() });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get a dice roll session by ID
  app.get("/api/dice-rolls/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const diceRoll = await storage.getDiceRoll(sessionId);
      if (!diceRoll) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json(diceRoll);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a dice roll session (add new roll)
  app.patch("/api/dice-rolls/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const validatedData = updateDiceRollSchema.parse(req.body);
      const diceRoll = await storage.updateDiceRoll(sessionId, validatedData);
      if (!diceRoll) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json(diceRoll);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ message: fromError(error).toString() });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return httpServer;
}
