
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getExplanationForName(name: string, transliteration: string): Promise<string> {
    const prompt = `You are a knowledgeable and gentle Islamic scholar. 
    Provide a brief, profound, and easy-to-understand explanation for the name of Allah: "${name}" (${transliteration}). 
    Focus on its core meaning and significance for a believer. 
    Keep the explanation to 2-3 sentences. Do not use markdown.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                temperature: 0.5,
                topP: 0.95,
                topK: 40,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating explanation with Gemini:", error);
        return "Could not fetch an explanation at this time. Please try again later.";
    }
}
