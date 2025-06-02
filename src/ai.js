import dotenv from 'dotenv';
dotenv.config()

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in the environment variables.");

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function getAIResponse(query) {
  try {
    const contents = [
      {
        role: "user",
        parts: [{ text: `${query}` }]
      }
    ];
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
    });
    return response.text;
  } catch (error) {
    console.error("Fehler bei der Generierung der AI-Antwort:", error);
    return "Entschuldigung, ich konnte keine Antwort generieren.";
  }
}