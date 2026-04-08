"use server";

import { GoogleGenAI } from "@google/genai";

export async function analyzeCarIssue(description: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User says: "${description}". Briefly identify potential car problems (1-2 sentences) and suggest if it is an emergency or a normal service. Respond in Swahili and English.`,
      config: {
        maxOutputTokens: 150,
        thinkingConfig: { thinkingBudget: 50 }
      }
    });
    return response.text || "Pata ushauri kwa kupiga simu. Get advice by calling.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maelezo yako yamepokelewa. Your details are received.";
  }
}
