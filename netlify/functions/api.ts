import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getStorage } from "../../server/storage";
import { insertDiceRollSchema, updateDiceRollSchema } from "../../shared/schema";
import { fromError } from "zod-validation-error";

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { path, httpMethod, body } = event;

  // Extract session ID from path if present
  const pathMatch = path.match(/\/api\/dice-rolls\/([^\/]+)/);
  const sessionId = pathMatch ? pathMatch[1] : null;

  try {
    const storage = await getStorage();

    // POST /api/dice-rolls - Create new session
    if (httpMethod === "POST" && path === "/api/dice-rolls") {
      const validatedData = insertDiceRollSchema.parse(JSON.parse(body || "{}"));
      const diceRoll = await storage.createDiceRoll(validatedData);
      return {
        statusCode: 201,
        body: JSON.stringify(diceRoll),
        headers: { "Content-Type": "application/json" },
      };
    }

    // GET /api/dice-rolls/:sessionId - Get session
    if (httpMethod === "GET" && sessionId) {
      const diceRoll = await storage.getDiceRoll(sessionId);
      if (!diceRoll) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Session not found" }),
          headers: { "Content-Type": "application/json" },
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(diceRoll),
        headers: { "Content-Type": "application/json" },
      };
    }

    // PATCH /api/dice-rolls/:sessionId - Update session
    if (httpMethod === "PATCH" && sessionId) {
      const validatedData = updateDiceRollSchema.parse(JSON.parse(body || "{}"));
      const diceRoll = await storage.updateDiceRoll(sessionId, validatedData);
      if (!diceRoll) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Session not found" }),
          headers: { "Content-Type": "application/json" },
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(diceRoll),
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
