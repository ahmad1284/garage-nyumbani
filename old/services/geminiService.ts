
import { GoogleGenAI } from "@google/genai";

export const analyzeCarIssue = async (description: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User says: "${description}". Briefly identify potential car problems (1-2 sentences) and suggest if it is an emergency or a normal service. Respond in Swahili and English.`,
      config: {
        // Following guidelines: Set thinkingBudget when maxOutputTokens is used to avoid empty responses.
        maxOutputTokens: 150,
        thinkingConfig: { thinkingBudget: 50 }
      }
    });
    return response.text || "Pata ushauri kwa kupiga simu. Get advice by calling.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maelezo yako yamepokelewa. Your details are received.";
  }
};
