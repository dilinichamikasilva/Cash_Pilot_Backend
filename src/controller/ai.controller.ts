import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export const getAISuggestions = async (req: Request, res: Response) => {
  try {
    const { income, currency } = req.query;

    if (!income || isNaN(Number(income))) {
      return res.status(400).json({ message: "Income is required" });
    }

    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: [{
        role: "user",
        parts: [{
          text: `You are a financial expert. Suggest a monthly budget for an income of ${income} ${currency}. 
                 Return ONLY a JSON array: [{"name": "string", "budget": number}]. 
                 Total sum must be ${income}. No extra text.`
        }]
      }]
    });

   
    const text = response.text || "";

    if (!text) {
      return res.status(500).json({ message: "Empty AI response" });
    }

    
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(cleanJson);

    return res.status(200).json({ suggestions });

  } catch (err: any) {
    console.error("AI SDK Error:", err);
    return res.status(500).json({ 
      message: "AI Generation failed", 
      details: err.message 
    });
  }
};