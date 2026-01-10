import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const kitchenObjects = [
  "rolling pin", "whisk", "spatula", "wooden spoon", "measuring cup", "colander",
  "cheese grater", "can opener", "potato masher", "ladle", "tongs", "peeler",
  "cutting board", "mixing bowl", "tea kettle", "coffee mug", "salt shaker",
  "pepper mill", "timer", "oven mitt", "apron", "dish towel", "cookie jar"
];

export interface KitchenMemory {
  object: string;
  imageBase64: string;
  imageDescription: string;
  memory: string;
}

export async function generateKitchenMemory(): Promise<KitchenMemory> {
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

  const imagePrompt = `A simple, clean, cartoonish illustration of a ${randomObject} on a white background. The style should be friendly, colorful, and slightly whimsical. The object should be the main focus, centered in the image.`;

  const imageResult = await imageModel.generateContent(imagePrompt);

  // Extract base64 image from response
  const imagePart = imageResult.response.candidates?.[0]?.content?.parts?.find(
    part => 'inlineData' in part && part.inlineData
  );

  let imageBase64 = "";
  if (imagePart && 'inlineData' in imagePart && imagePart.inlineData) {
    imageBase64 = imagePart.inlineData.data;
  }

  const imageDescription = `A cartoonish illustration of a ${randomObject}`;

  return {
    object: randomObject,
    imageBase64,
    imageDescription,
    memory: memory.trim()
  };
}
