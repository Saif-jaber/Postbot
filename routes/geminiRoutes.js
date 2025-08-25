import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const router = express.Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

router.post("/ask", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt is required." });

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    console.log("🔍 Full Gemini API response:", JSON.stringify(data, null, 2));

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

    res.json({ response: reply });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Gemini API request failed." });
  }
});

export default router;
