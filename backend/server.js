import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  searchKaprukaProducts,
  getKaprukaProduct,
  checkKaprukaDelivery,
  trackKaprukaOrder,
  createKaprukaOrder,
} from "./mcpClient.js";

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

function extractBudget(message) {
  const match = message.match(/(?:rs\.?|lkr)?\s*(\d{3,6})/i);
  return match ? Number(match[1]) : null;
}

function getSearchQuery(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("chocolate") || lowerMessage.includes("chocolates")) {
    return "chocolate";
  }

  if (lowerMessage.includes("cake") || lowerMessage.includes("cakes")) {
    return "cake";
  }

  if (lowerMessage.includes("flower") || lowerMessage.includes("flowers")) {
    return "flowers";
  }

  return message;
}

function filterProducts(products, message) {
  const budget = extractBudget(message);
  const lowerMessage = message.toLowerCase();

  return products.filter((product) => {
    const searchableText = `${product.name} ${product.summary || ""}`.toLowerCase();

    const matchesBudget = budget ? product.price <= budget : true;

    const matchesKeyword = lowerMessage.includes("chocolate") || lowerMessage.includes("chocolates")
      ? searchableText.includes("chocolate") || searchableText.includes("choc")
      : true;

    return matchesBudget && matchesKeyword;
  });
}

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const searchQuery = getSearchQuery(message);
    const searchedProducts = await searchKaprukaProducts(searchQuery);
    const products = filterProducts(searchedProducts, message);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are a friendly AI shopping assistant for Kapruka.

Use ONLY the real Kapruka products provided below.
Do not invent product names, prices, product IDs, images, or links.
If the products are not suitable, politely ask the user to try a more specific search.

User message:
${message}

Available Kapruka products:
${JSON.stringify(products, null, 2)}

Reply in a helpful way.
Mention product name, price in LKR, and link.
`,
    });

    res.json({
      reply: response.text,
      products,
    });
  } catch (error) {
    console.error("Chat error:", error);
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

const PORT = process.env.PORT || 5000;

app.get("/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await getKaprukaProduct(productId);

    res.json(product);
  } catch (error) {
    console.error("Product details error:", error);
    res.status(500).json({
      error: "Failed to get Kapruka product details",
    });
  }
});

app.get("/delivery-check", async (req, res) => {
  try {
    const { city, date, productId } = req.query;

    if (!city) {
      return res.status(400).json({
        error: "City is required",
      });
    }

    const result = await checkKaprukaDelivery(city, date, productId);

    res.json(result);
  } catch (error) {
    console.error("Delivery check error:", error);
    res.status(500).json({
      error: "Failed to check delivery",
    });
  }
});

app.get("/track-order/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const result = await trackKaprukaOrder(orderNumber);

    res.json(result);
  } catch (error) {
    console.error("Order tracking error:", error);
    res.status(500).json({
      error: "Failed to track Kapruka order",
    });
  }
});

app.post("/create-order", async (req, res) => {
  try {
    const orderData = req.body;

    const result = await createKaprukaOrder(orderData);

    res.json(result);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      error: "Failed to create Kapruka order",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});