import dotenv from 'dotenv';
// Lade explizit .env aus dem Root-Verzeichnis
dotenv.config({ path: '../.env' });


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}



import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function getAIResponse(query) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: query,
    });
    console.log(response.text);
    return response.text;
  } catch (e) {
    return "Entschuldigung, ich konnte keine Antwort generieren.";
  }
}
