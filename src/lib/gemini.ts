import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export interface Message {
  role: 'user' | 'model';
  content: string;
  isTemp?: boolean;
}

const SYSTEM_PROMPT = `You are Lightning AI, the core intelligence of Lightning OS. 
You are an advanced agentic assistant built for speed, elegance, and extreme technical precision.
Your communication style is:
- **Minimalist**: No unnecessary preamble. Get straight to the point.
- **Technical Excellence**: Prioritize accuracy and efficiency in every solution.
- **Structure**: Use rich Markdown (headings, tables, code blocks, bold text) to ensure information is easy to parse.
- **Distinctive**: Your personality is calm, refined, and slightly futuristic.

When starting a complex task, you may use technical status headers like [PROCESS_ATTACHED] or [INIT_CALCULATION] at the very beginning for atmospheric effect. Always conclude with polished, production-ready information.`;

export async function sendMessage(messages: Message[]) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Please set it in the Secrets panel.");
  }

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: SYSTEM_PROMPT,
    }
  });

  return result.text || "Sorry, I couldn't generate a response.";
}

export async function* sendMessageStream(messages: Message[]) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Please set it in the Secrets panel.");
  }

  const stream = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: SYSTEM_PROMPT,
    }
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
