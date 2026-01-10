import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertMemorySchema, updateMemorySchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { generateKitchenMemory } from "./gemini";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Memory endpoints

  // Get all memories
  app.get("/api/memories", async (req, res) => {
    try {
      const storage = await getStorage();
      const memories = await storage.getAllMemories();
      res.json(memories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new memory session
  app.post("/api/memories", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertMemorySchema.parse(req.body);
      const memory = await storage.createMemory(validatedData);
      res.status(201).json(memory);
    } catch (error: any) {
      console.error("Error creating memory:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ message: fromError(error).toString() });
      } else {
        res.status(500).json({ message: "Internal server error", error: error.message });
      }
    }
  });

  // Get a memory by ID
  app.get("/api/memories/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const memory = await storage.getMemory(id);
      if (!memory) {
        res.status(404).json({ message: "Memory not found" });
        return;
      }
      res.json(memory);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate memory with Gemini
  app.post("/api/memories/:id/generate", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;

      // Generate kitchen memory with Gemini
      try {
        const kitchenMemory = await generateKitchenMemory();
        const memory = await storage.updateMemory(id, {
          imageBase64: kitchenMemory.imageBase64,
          imageDescription: kitchenMemory.imageDescription,
          memory: kitchenMemory.memory,
        });

        if (!memory) {
          res.status(404).json({ message: "Memory not found" });
          return;
        }
        res.json(memory);
      } catch (geminiError) {
        console.error("Failed to generate kitchen memory:", geminiError);
        res.status(500).json({ message: "Failed to generate memory", error: (geminiError as Error).message });
      }
    } catch (error: any) {
      console.error("Error generating memory:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update memory (for editing the memory text)
  app.patch("/api/memories/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const validatedData = updateMemorySchema.parse(req.body);

      const memory = await storage.updateMemory(id, validatedData);
      if (!memory) {
        res.status(404).json({ message: "Memory not found" });
        return;
      }
      res.json(memory);
    } catch (error: any) {
      console.error("Error updating memory:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ message: fromError(error).toString() });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return httpServer;
}
