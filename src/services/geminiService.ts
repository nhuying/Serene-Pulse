import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const chatWithGemini = async (message: string, history: { role: "user" | "model"; parts: { text: string }[] }[] = []) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are Serene, a helpful wellness assistant for the Serene Pulse app. You help users with their 12-week transformation journey, providing advice on fasting, nutrition, sleep, and mindfulness. Be encouraging, professional, and concise.",
      },
    });

    // Note: sendMessage doesn't take history directly in this SDK version's create call, 
    // but we can simulate it if needed or just use the chat instance.
    // For simplicity in this app, we'll just send the message.
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
};

export const generateWellnessImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [{ text: `A high-quality, serene wellness image: ${prompt}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};
