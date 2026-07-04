// src/lib/ai/geminiClient.ts

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY as string;
const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const genAI = new GoogleGenAI({ apiKey });

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const response = await genAI.models.generateContent({
    model: modelName,
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  });

  return response.text ?? "";
}

export async function generateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const response = await genAI.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
  });

  const raw = response.text ?? "{}";
  return JSON.parse(raw) as T;
}