import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getStorage } from "../../server/storage";
import { insertMemorySchema, updateMemorySchema } from "../../shared/schema";
import { fromError } from "zod-validation-error";
import { generateKitchenMemory } from "../../server/gemini";

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { path, httpMethod, body } = event;

  // Extract session ID from path if present
  const pathMatch = path.match(/\/api\/memories\/([^\/]+)/);
  const sessionId = pathMatch ? pathMatch[1] : null;

  try {
    const storage = await getStorage();

    // GET /api/memories - Get all memories
    if (httpMethod === "GET" && path === "/api/memories") {
      const memories = await storage.getAllMemories();
      return {
        statusCode: 200,
        body: JSON.stringify(memories),
        headers: { "Content-Type": "application/json" },
      };
    }

    // POST /api/memories - Create new session
    if (httpMethod === "POST" && path === "/api/memories") {
      const validatedData = insertMemorySchema.parse(JSON.parse(body || "{}"));
      const memory = await storage.createMemory(validatedData);
      return {
        statusCode: 201,
        body: JSON.stringify(memory),
        headers: { "Content-Type": "application/json" },
      };
    }

    // GET /api/memories/:sessionId - Get session
    if (httpMethod === "GET" && sessionId && !path.endsWith("/generate")) {
      const memory = await storage.getMemory(sessionId);
      if (!memory) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Session not found" }),
          headers: { "Content-Type": "application/json" },
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(memory),
        headers: { "Content-Type": "application/json" },
      };
    }

    // POST /api/memories/:sessionId/generate - Generate memory
    if (httpMethod === "POST" && sessionId && path.endsWith("/generate")) {
      try {
        const kitchenMemory = await generateKitchenMemory();
        const memory = await storage.updateMemory(sessionId, {
          imageBase64: kitchenMemory.imageBase64,
          imageDescription: kitchenMemory.imageDescription,
          memory: kitchenMemory.memory,
        });

        if (!memory) {
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Session not found" }),
            headers: { "Content-Type": "application/json" },
          };
        }
        return {
          statusCode: 200,
          body: JSON.stringify(memory),
          headers: { "Content-Type": "application/json" },
        };
      } catch (geminiError) {
        console.error("Failed to generate kitchen memory:", geminiError);
        return {
          statusCode: 500,
          body: JSON.stringify({ message: "Failed to generate memory", error: (geminiError as Error).message }),
          headers: { "Content-Type": "application/json" },
        };
      }
    }

    // PATCH /api/memories/:sessionId - Update memory
    if (httpMethod === "PATCH" && sessionId) {
      const validatedData = updateMemorySchema.parse(JSON.parse(body || "{}"));
      const memory = await storage.updateMemory(sessionId, validatedData);
      if (!memory) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Session not found" }),
          headers: { "Content-Type": "application/json" },
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(memory),
        headers: { "Content-Type": "application/json" },
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Not found" }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error: any) {
    console.error("Error in API handler:", error);
    if (error.name === "ZodError") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: fromError(error).toString() }),
        headers: { "Content-Type": "application/json" },
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
