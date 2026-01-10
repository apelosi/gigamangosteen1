import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertObjectMemorySchema, updateObjectMemorySchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { generateKitchenMemory, describeImageForMatching, findMatchingDescription } from "./gemini";

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

  // Remember feature - match an image against saved memories
  app.post("/api/remember/match", async (req, res) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        res.status(400).json({ message: "imageBase64 is required" });
        return;
      }

      // Step 1: Generate description of the new image
      const descriptionResult = await describeImageForMatching(imageBase64);
      const newDescription = descriptionResult.objectDescription;

      // Step 2: Get all saved memories from database
      const storage = await getStorage();
      const allMemories = await storage.getAllObjectMemories();

      // Filter to only memories that have descriptions
      const memoriesWithDescriptions = allMemories
        .filter(m => m.objectDescription && m.objectDescription.trim().length > 0)
        .map(m => ({
          id: m.id,
          description: m.objectDescription!
        }));

      if (memoriesWithDescriptions.length === 0) {
        // No saved memories to match against
        res.json({
          found: false,
          description: newDescription
        });
        return;
      }

      // Step 3: Use AI to find matching description
      const matchResult = await findMatchingDescription(newDescription, memoriesWithDescriptions);

      if (matchResult.matched && matchResult.matchedId) {
        // Found a match - get the full memory record
        const matchedMemory = allMemories.find(m => m.id === matchResult.matchedId);
        if (matchedMemory) {
          res.json({
            found: true,
            description: newDescription,
            matchedMemory: {
              id: matchedMemory.id,
              objectDescription: matchedMemory.objectDescription,
              objectMemory: matchedMemory.objectMemory,
              userImageBase64: matchedMemory.userImageBase64
            }
          });
          return;
        }
      }

      // No match found
      res.json({
        found: false,
        description: newDescription
      });
    } catch (error: any) {
      console.error("Error matching object:", error);
      res.status(500).json({ message: "Failed to match object", error: error.message });
    }
  });

  return httpServer;
}
