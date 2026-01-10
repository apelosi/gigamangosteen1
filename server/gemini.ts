import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const kitchenObjects = [
  "rolling pin", "whisk", "spatula", "wooden spoon", "measuring cup", "colander",
  "cheese grater", "can opener", "potato masher", "ladle", "tongs", "peeler",
  "cutting board", "mixing bowl", "tea kettle", "coffee mug", "salt shaker",
  "pepper mill", "timer", "oven mitt", "apron", "dish towel", "cookie jar"
];

export interface KitchenMemoryResult {
  object: string;
  objectImageBase64: string;
  objectDescription: string;
  objectMemory: string;
}

export interface UserImageAnalysisResult {
  objectDescription: string;
  objectMemory: string;
}

export interface ImageDescriptionResult {
  objectDescription: string;
}

// Analyze an image and return just the description (for Remember feature)
export async function describeImageForMatching(imageBase64: string): Promise<ImageDescriptionResult> {
  const visionModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const analysisPrompt = `Analyze this image and identify the MAIN OBJECT being shown. Focus ONLY on the primary object itself.

CRITICAL INSTRUCTIONS:
- IGNORE any humans, hands, fingers, or body parts in the image - do NOT mention them
- IGNORE any other objects in the background or periphery
- IGNORE how the object is being held or positioned
- If part of the object is obscured, you may briefly note which part is not fully visible
- If the image is dimly lit, you may note the lighting conditions
- Focus ENTIRELY on describing the main object itself

Provide a detailed description of the object (100-200 words) including:
- What the object is (be specific - e.g., "ceramic coffee mug" not just "mug")
- Its primary colors and materials
- Any visible wear, imperfections, or unique features
- Distinguishing characteristics

Return ONLY the description text, no JSON formatting.`;

  const imageResult = await visionModel.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg"
      }
    },
    { text: analysisPrompt }
  ]);

  return {
    objectDescription: imageResult.response.text().trim()
  };
}

// Compare a new description against saved descriptions to find matches
export async function findMatchingDescription(
  newDescription: string,
  savedDescriptions: { id: string; description: string }[]
): Promise<{ matched: boolean; matchedId?: string; confidence?: number }> {
  if (savedDescriptions.length === 0) {
    return { matched: false };
  }

  const textModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const matchPrompt = `You are comparing object descriptions to find if two descriptions refer to the SAME physical object.

NEW OBJECT DESCRIPTION:
"${newDescription}"

SAVED OBJECT DESCRIPTIONS:
${savedDescriptions.map((d, i) => `[${i}] ID: ${d.id}\nDescription: "${d.description}"`).join('\n\n')}

TASK: Determine if the NEW OBJECT matches ANY of the SAVED OBJECTS. Two descriptions match if they describe the SAME TYPE of object (e.g., both are coffee mugs, both are rolling pins) with similar characteristics.

IMPORTANT:
- Focus on the TYPE of object first (is it the same kind of item?)
- Then consider distinctive features, colors, materials
- Minor differences in wording are OK if they describe the same object
- Return NO MATCH if the objects are clearly different types

Respond with JSON format:
{
  "matched": true/false,
  "matchedId": "the ID of the matching saved object if matched, otherwise null",
  "confidence": 0-100 (how confident you are in the match)
}

Only return matched: true if you are at least 70% confident it's the same object.`;

  const result = await textModel.generateContent({
    contents: [{ role: "user", parts: [{ text: matchPrompt }] }],
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.3,
    },
  });

  const responseText = result.response.text();

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        matched: parsed.matched === true,
        matchedId: parsed.matchedId || undefined,
        confidence: parsed.confidence || 0
      };
    }
  } catch (error) {
    console.error("Failed to parse match response:", error);
  }

  return { matched: false };
}

export async function analyzeUserImage(userImageBase64: string): Promise<UserImageAnalysisResult> {
  // Use Gemini vision model to analyze the user's image
  const visionModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  // First, identify what the object is and generate a description
  const analysisPrompt = `Analyze this image and identify the MAIN OBJECT being shown. Focus ONLY on the primary object itself.

CRITICAL INSTRUCTIONS:
- IGNORE any humans, hands, fingers, or body parts in the image - do NOT mention them
- IGNORE any other objects in the background or periphery
- IGNORE how the object is being held or positioned
- If part of the object is obscured, you may briefly note which part is not fully visible
- If the image is dimly lit, you may note the lighting conditions
- Focus ENTIRELY on describing the main object itself

Provide:
1. A detailed description of the object (150-250 words) including:
   - What the object is
   - Its colors, materials, and textures
   - Any visible wear, imperfections, or unique features
   - Estimated dimensions if possible
   - Any distinguishing characteristics

2. A nostalgic, personal memory (2-3 sentences) that someone might have about this specific object. Make it realistic and heartfelt, including specific details about when they might have gotten it, why it's meaningful, and what emotions it evokes.

Format your response as JSON with two fields: "description" and "memory"`;

  const imageResult = await visionModel.generateContent([
    {
      inlineData: {
        data: userImageBase64,
        mimeType: "image/jpeg"
      }
    },
    { text: analysisPrompt }
  ]);

  const responseText = imageResult.response.text();

  // Parse the JSON response
  let description = "";
  let memory = "";

  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      description = parsed.description || "";
      memory = parsed.memory || "";
    }
  } catch (error) {
    console.error("Failed to parse JSON response, using fallback parsing");
    // Fallback: try to extract description and memory from text
    const descMatch = responseText.match(/description["\s:]+([^}]+)/i);
    const memMatch = responseText.match(/memory["\s:]+([^}]+)/i);
    description = descMatch ? descMatch[1].replace(/["]/g, "").trim() : responseText;
    memory = memMatch ? memMatch[1].replace(/["]/g, "").trim() : "This object holds special memories.";
  }

  return {
    objectDescription: description.trim(),
    objectMemory: memory.trim()
  };
}

export async function generateKitchenMemory(): Promise<KitchenMemoryResult> {
  const randomObject = kitchenObjects[Math.floor(Math.random() * kitchenObjects.length)];

  // Generate the memory and description using Gemini 3 Flash model
  const textModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const memoryPrompt = `Generate a nostalgic, personal memory about a ${randomObject} that someone might have. The memory should be 2-3 sentences and include specific details about when they got it, why it's meaningful, and what emotions it evokes. Make it realistic and heartfelt, like the example: "I bought this rolling pin about 5 years ago during covid when I was stuck at home and was baking a lot of bread. It brings back both good memories of making sourdough, but also sad memories of how much covid prevented me from seeing my friends and family."`;

  const memoryResult = await textModel.generateContent(memoryPrompt);
  const memory = memoryResult.response.text();

  // Generate the image using Gemini 3 Pro Image (Nano Banana Pro)
  const imageModel = genAI.getGenerativeModel({
    model: "gemini-3-pro-image-preview"
  });

  const imagePrompt = `A photorealistic photograph of a well-used, vintage ${randomObject} on a rustic wooden kitchen counter. The lighting should be warm and natural, like morning sunlight through a window. The ${randomObject} should show signs of age and use - perhaps some wear marks, patina, or slight imperfections that give it character. Include subtle background elements like a kitchen towel or other kitchen items slightly out of focus. High detail, sharp focus on the main object, shallow depth of field.`;

  const imageResult = await imageModel.generateContent(imagePrompt);

  // Extract base64 image from response
  const imagePart = imageResult.response.candidates?.[0]?.content?.parts?.find(
    part => 'inlineData' in part && part.inlineData
  );

  let objectImageBase64 = "";
  if (imagePart && 'inlineData' in imagePart && imagePart.inlineData) {
    objectImageBase64 = imagePart.inlineData.data;
  }

  // Generate a detailed description of the image
  const descriptionPrompt = `You are describing a photograph of ONE SPECIFIC, UNIQUE ${randomObject} - not a generic ${randomObject}, but THIS PARTICULAR ONE with all its individual characteristics that make it different from every other ${randomObject} in existence.

REQUIRED LENGTH: 150-250 words minimum. Short descriptions are NOT acceptable.

YOUR DESCRIPTION MUST INCLUDE ALL OF THE FOLLOWING (do not skip any):

1. EXACT COLORS WITH NUANCE - Not just "blue" but "deep navy blue with subtle cobalt undertones" or "faded turquoise with hints of oxidized copper green at the edges"

2. SPECIFIC MATERIAL AND TEXTURE DETAILS - The surface quality (smooth, rough, pitted, grainy), any patina, finish type (matte, semi-gloss, lacquered), wood grain direction and pattern if applicable

3. PRECISE MEASUREMENTS - Estimate dimensions in inches/centimeters (e.g., "approximately 12 inches long and 2 inches in diameter at the widest point")

4. AT LEAST 3 UNIQUE IMPERFECTIONS - Specific scratches (their location, length, depth), dents, chips, discoloration spots, stains, worn areas, fading patterns - describe exactly where each is located

5. AT LEAST 2 DISTINGUISHING FEATURES - What makes THIS ${randomObject} absolutely unique? A manufacturer's mark? An unusual handle shape? A repair mark? Engraving? Unusual proportions?

6. SIGNS OF AGE AND USE PATTERNS - Where has it been gripped repeatedly? What areas show the most wear? Are there heat marks, water stains, or usage-specific wear patterns?

EXAMPLE OF ACCEPTABLE DETAIL LEVEL:
"This rolling pin measures approximately 18 inches in total length with a 10-inch barrel that tapers slightly from 2.5 inches at center to 2.25 inches at the ends. The maple wood has aged to a warm honey-amber tone with darker caramel streaks following the grain diagonally across the barrel. The left handle shows a distinctive 3-inch hairline crack running parallel to the grain, filled with decades of accumulated flour residue that has darkened to a cream-gray. Three small dents cluster near the right end of the barrel, each about 1/4 inch diameter, likely from striking a counter edge. The handles have been worn smooth and slightly flattened on the underside from years of palm pressure, with the wood here darkened to a deeper walnut brown from absorbed oils. A faint 'K.M.' has been carved into the base of the right handle in a shaky script, approximately 1/2 inch tall."

CRITICAL: Generic descriptions like "a wooden rolling pin with some wear" are NOT acceptable. Every sentence must contain specific, measurable, or precisely located details.`;

  const descriptionResult = await textModel.generateContent({
    contents: [{ role: "user", parts: [{ text: descriptionPrompt }] }],
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.8,
    },
  });
  const objectDescription = descriptionResult.response.text().trim();

  return {
    object: randomObject,
    objectImageBase64,
    objectDescription,
    objectMemory: memory.trim()
  };
}
