import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertObjectMemorySchema, updateObjectMemorySchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { generateKitchenMemory } from "./gemini";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Object Memory endpoints

  // Get all object memories
  app.get("/api/memories", async (req, res) => {
    try {
      const storage = await getStorage();
      const memories = await storage.getAllObjectMemories();
      res.json(memories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new object memory session
  app.post("/api/memories", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertObjectMemorySchema.parse(req.body);
      const memory = await storage.createObjectMemory(validatedData);
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

  // Get an object memory by ID
  app.get("/api/memories/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const memory = await storage.getObjectMemory(id);
      if (!memory) {
        res.status(404).json({ message: "Memory not found" });
        return;
      }
      res.json(memory);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate object memory with Gemini
  app.post("/api/memories/:id/generate", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;

      // Get the memory to check if user uploaded an image
      const existingMemory = await storage.getObjectMemory(id);
      if (!existingMemory) {
        res.status(404).json({ message: "Memory not found" });
        return;
      }

      try {
        let updateData;

        if (existingMemory.userImageBase64) {
          // User uploaded an image - analyze it
          const { analyzeUserImage } = await import("./gemini");
          const analysis = await analyzeUserImage(existingMemory.userImageBase64);
          updateData = {
            objectDescription: analysis.objectDescription,
            objectMemory: analysis.objectMemory,
          };
        } else {
          // No user image - generate random kitchen memory
          const { generateKitchenMemory } = await import("./gemini");
          const kitchenMemory = await generateKitchenMemory();
          updateData = {
            objectImageBase64: kitchenMemory.objectImageBase64,
            objectDescription: kitchenMemory.objectDescription,
            objectMemory: kitchenMemory.objectMemory,
          };
        }

        const memory = await storage.updateObjectMemory(id, updateData);

        if (!memory) {
          res.status(404).json({ message: "Memory not found" });
          return;
        }
        res.json(memory);
      } catch (geminiError) {
        console.error("Failed to generate memory:", geminiError);
        res.status(500).json({ message: "Failed to generate memory", error: (geminiError as Error).message });
      }
    } catch (error: any) {
      console.error("Error generating memory:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update object memory image (for replacing the user image)
  app.patch("/api/memories/:id/image", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const { userImageBase64 } = req.body;

      if (!userImageBase64) {
        res.status(400).json({ message: "userImageBase64 is required" });
        return;
      }

      // Update only the user image, clear out generated content since we'll regenerate
      const memory = await storage.updateObjectMemory(id, {
        userImageBase64,
        objectDescription: undefined, // Keep existing until regeneration
        objectMemory: undefined, // Keep existing until regeneration
      });

      if (!memory) {
        res.status(404).json({ message: "Memory not found" });
        return;
      }
      res.json(memory);
    } catch (error: any) {
      console.error("Error updating memory image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update object memory (for editing the memory text)
  app.patch("/api/memories/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const validatedData = updateObjectMemorySchema.parse(req.body);

      const memory = await storage.updateObjectMemory(id, validatedData);
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
