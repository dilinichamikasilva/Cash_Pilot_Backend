"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAISuggestions = void 0;
const genai_1 = require("@google/genai");
const ai = new genai_1.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ""
});
const getAISuggestions = async (req, res) => {
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
    }
    catch (err) {
        console.error("AI SDK Error:", err);
        return res.status(500).json({
            message: "AI Generation failed",
            details: err.message
        });
    }
};
exports.getAISuggestions = getAISuggestions;
