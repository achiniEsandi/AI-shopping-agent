import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { searchKaprukaProducts } from "./mcpClient.js";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Kapruka AI Shopping Agent backend is running");
});

const PORT = process.env.PORT || 5000;

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are a friendly AI shopping assistant for Kapruka.
Help users find gifts, cakes, flowers, chocolates, and Sri Lankan delivery items.

User message: ${message}
      `,
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/test-search", async (req, res) => {
  try {
    const query = req.query.q || "birthday cake";
    const result = await searchKaprukaProducts(query);

    res.json(result);
  } catch (error) {
    console.error("MCP search error:", error);
    res.status(500).json({
      error: "Failed to search Kapruka products",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});