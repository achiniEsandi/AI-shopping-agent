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
  listKaprukaCategories,
  listKaprukaDeliveryCities,
} from "./mcpClient.js";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Kapruka AI Shopping Agent backend is running");
});

function extractIntentWithoutGemini(message) {
  const lower = message.toLowerCase();

  let minPrice = null;
  let maxPrice = null;

  const betweenMatch = lower.match(
    /between\s*(?:rs\.?|lkr)?\s*(\d{2,7})\s*(?:and|to|-)\s*(?:rs\.?|lkr)?\s*(\d{2,7})/i
  );

  if (betweenMatch) {
    minPrice = Number(betweenMatch[1]);
    maxPrice = Number(betweenMatch[2]);
  } else {
    const underMatch = lower.match(
      /(?:under|below|less than|max|maximum)\s*(?:rs\.?|lkr)?\s*(\d{2,7})/i
    );

    if (underMatch) {
      maxPrice = Number(underMatch[1]);
    }

    const overMatch = lower.match(
      /(?:over|above|more than|min|minimum)\s*(?:rs\.?|lkr)?\s*(\d{2,7})/i
    );

    if (overMatch) {
      minPrice = Number(overMatch[1]);
    }
  }

  let category = null;

  const categoryMap = [
    { words: ["birthday"], category: "birthday", query: "birthday gift" },
    {
      words: ["mother", "mom", "mum", "amma", "ammi"],
      category: "mother",
      query: "mother gift",
    },
    {
      words: ["anniversary", "romantic", "love", "wife", "girlfriend", "boyfriend"],
      category: null,
      query: "romantic gift",
    },
    { words: ["cake", "cakes"], category: "cakes", query: "cake" },
    { words: ["flower", "flowers", "rose", "roses", "bouquet"], category: "flowers", query: "flowers" },
    { words: ["chocolate", "chocolates"], category: "chocolates", query: "chocolate" },
    { words: ["toy", "toys", "kid", "kids", "child"], category: "KidsToys", query: "toys" },
    { words: ["fruit", "fruits"], category: "Fruits", query: "fruits" },
    { words: ["perfume", "perfumes"], category: "Perfumes", query: "perfume" },
    { words: ["book", "books"], category: "Books", query: "books" },
    { words: ["jewellery", "jewelry"], category: "Jewellery", query: "jewellery" },
  ];

  let query = "";

  for (const item of categoryMap) {
    if (item.words.some((word) => lower.includes(word))) {
      category = item.category;
      query = item.query;
      break;
    }
  }

  if (!query) {
    query = message
      .replace(
        /(?:under|below|less than|max|maximum|over|above|more than|min|minimum|between|and|to|rs\.?|lkr|rupees|\d+)/gi,
        ""
      )
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (query.length < 3) {
    query = "gift";
  }

  return {
    query,
    category,
    minPrice,
    maxPrice,
  };
}

async function extractShoppingIntent(message) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
Extract shopping intent from this user message.

Return ONLY valid JSON. Do not include markdown.

User message:
"${message}"

JSON format:
{
  "query": "short product search phrase",
  "category": null,
  "minPrice": null,
  "maxPrice": null
}
`,
    });

    const text = response.text.trim();
    return JSON.parse(text);
  } catch {
    console.error("Intent extraction failed. Using fallback intent.");
    return extractIntentWithoutGemini(message);
  }
}

function filterByBudget(products, intent) {
  return products.filter((product) => {
    if (!product.price) return false;
    if (intent.minPrice && product.price < intent.minPrice) return false;
    if (intent.maxPrice && product.price > intent.maxPrice) return false;
    return true;
  });
}

function removeDuplicateProducts(products) {
  const seen = new Set();

  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function getFallbackSearches(message, intent) {
  const lower = message.toLowerCase();

  if (
    lower.includes("anniversary") ||
    lower.includes("romantic") ||
    lower.includes("love") ||
    lower.includes("wife") ||
    lower.includes("girlfriend") ||
    lower.includes("boyfriend")
  ) {
    return [
      { query: "flowers", category: "flowers" },
      { query: "chocolate", category: "chocolates" },
      { query: "gift set", category: "Giftset" },
      { query: "valentine", category: "valentine" },
    ];
  }

  if (lower.includes("mother") || lower.includes("mom") || lower.includes("ammi")) {
    return [
      { query: "mother gift", category: "mother" },
      { query: "flowers", category: "flowers" },
      { query: "chocolate", category: "chocolates" },
      { query: "gift set", category: "Giftset" },
    ];
  }

  if (lower.includes("birthday")) {
    return [
      { query: "birthday gift", category: "birthday" },
      { query: "cake", category: "cakes" },
      { query: "chocolate", category: "chocolates" },
      { query: "gift set", category: "Giftset" },
    ];
  }

  return [
    { query: intent.query || "gift", category: null },
    { query: "gift", category: null },
    { query: "bestsellers", category: "bestsellers" },
  ];
}

async function searchWithFallbacks(message, intent) {
  let products = await searchKaprukaProducts({
    query: intent.query || "gift",
    category: null,
    minPrice: intent.minPrice || null,
    maxPrice: intent.maxPrice || null,
    limit: 10,
  });

  products = filterByBudget(products, intent);

  if (products.length > 0) {
    return products;
  }

  const fallbackSearches = getFallbackSearches(message, intent);
  let fallbackProducts = [];

  for (const search of fallbackSearches) {
    const result = await searchKaprukaProducts({
      query: search.query,
      category: null,
      minPrice: intent.minPrice || null,
      maxPrice: intent.maxPrice || null,
      limit: 10,
    });

    fallbackProducts = [...fallbackProducts, ...filterByBudget(result, intent)];

    if (fallbackProducts.length >= 6) {
      break;
    }
  }

  return removeDuplicateProducts(fallbackProducts).slice(0, 10);
}

function createFallbackReply(products) {
  if (products.length > 0) {
    return `I found ${products.length} matching Kapruka products for you. Please check the product cards below.`;
  }

  return "I couldn't find matching Kapruka products. Please try a different or more specific request.";
}

async function createAiReply(message, intent, products) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are a friendly AI shopping assistant for Kapruka.

Use ONLY the real Kapruka products provided below.
Do not invent product names, prices, product IDs, images, or links.

User message:
${message}

Shopping intent:
${JSON.stringify(intent, null, 2)}

Available Kapruka products:
${JSON.stringify(products, null, 2)}

Reply briefly in 1-2 sentences only.
Do not list all products.
The frontend will display the product cards separately.
`,
    });

    return response.text || createFallbackReply(products);
  } catch {
    console.error("Gemini reply failed. Using fallback reply.");
    return createFallbackReply(products);
  }
}

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const intent = await extractShoppingIntent(message);
    const products = await searchWithFallbacks(message, intent);
    const reply = await createAiReply(message, intent, products);

    res.json({
      reply,
      intent,
      products,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.get("/test-search", async (req, res) => {
  try {
    const query = req.query.q || "birthday cake";

    const result = await searchKaprukaProducts({
      query,
      limit: 10,
    });

    res.json(result);
  } catch (error) {
    console.error("MCP search error:", error);
    res.status(500).json({
      error: "Failed to search Kapruka products",
    });
  }
});

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

app.get("/categories", async (req, res) => {
  try {
    const result = await listKaprukaCategories();

    res.json(result);
  } catch (error) {
    console.error("Categories error:", error);
    res.status(500).json({
      error: "Failed to list categories",
    });
  }
});

app.get("/delivery-cities", async (req, res) => {
  try {
    const query = req.query.query || "";
    const result = await listKaprukaDeliveryCities(query);

    res.json(result);
  } catch (error) {
    console.error("Delivery cities error:", error);
    res.status(500).json({
      error: "Failed to list delivery cities",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});