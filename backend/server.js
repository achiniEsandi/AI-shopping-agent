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
import { normalizeMessageToIntent } from "./sriLankanHelper.js";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.set("etag", false);

app.use(cors());
app.use(express.json());

// Disable caching globally for API endpoints to prevent 304 Not Modified statuses
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.get("/", (req, res) => {
  res.send("Kapruka AI Shopping Agent backend is running");
});

// Mock in-memory database of users for Tier Tracking and Concierge Management
const users = [
  { id: "1", name: "John Jayawardene", email: "john@kapruka.com", password: "password123", tier: "Diamond" },
  { id: "2", name: "Sarah Perera", email: "sarah@kapruka.com", password: "password123", tier: "Gold" },
  { id: "3", name: "Dilshan Silva", email: "dilshan@kapruka.com", password: "password123", tier: "Standard" }
];

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    tier: user.tier
  });
});

app.post("/register", (req, res) => {
  const { name, email, password, tier } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  const newUser = {
    id: String(users.length + 1),
    name: name.trim(),
    email: email.trim(),
    password: password,
    tier: tier || "Standard"
  };

  users.push(newUser);

  res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    tier: newUser.tier
  });
});

app.post("/upgrade-tier", (req, res) => {
  const { email, tier } = req.body;

  if (!email || !tier) {
    return res.status(400).json({ error: "Email and selected tier are required" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.tier = tier;

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    tier: user.tier
  });
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
        /(?:under|below|less than|max|maximum|over|above|more than|between|and|to|rs\.?|lkr|rupees|\d+)/gi,
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
  // 1. Parse using local baseline parser (Sinhala/Singlish/Tamil/Tanglish fallback)
  const localIntent = normalizeMessageToIntent(message);

  try {
    // 2. Refine using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
Extract shopping intent from this user message. The message can be in English, Sinhala, Singlish (Romanized Sinhala), Tamil, or Tanglish (Romanized Tamil).
Produce the query, category, minPrice, maxPrice, deliveryDate, and city in standard English mapping.

Return ONLY valid JSON. Do not include markdown.

User message:
"${message}"

JSON format:
{
  "query": "short product search phrase in English (e.g. 'cake', 'flowers', 'perfume')",
  "category": "matched category slug in English (e.g. 'cakes', 'flowers', 'chocolates', 'KidsToys', 'Perfumes', 'Books', 'Fruits', 'Jewellery') or null",
  "minPrice": number or null,
  "maxPrice": number or null,
  "deliveryDate": "YYYY-MM-DD or null",
  "city": "Colombo or Kandy or Galle or Negombo or Kurunegala or null"
}
`,
    });

    const text = response.text.trim();
    const geminiIntent = JSON.parse(text);
    
    return {
      language: localIntent.language,
      query: geminiIntent.query || localIntent.query || "gift",
      category: geminiIntent.category || localIntent.category,
      minPrice: geminiIntent.minPrice !== undefined ? geminiIntent.minPrice : localIntent.minPrice,
      maxPrice: geminiIntent.maxPrice !== undefined ? geminiIntent.maxPrice : localIntent.maxPrice,
      deliveryDate: geminiIntent.deliveryDate || localIntent.deliveryDate,
      city: geminiIntent.city || localIntent.city,
      recipient: localIntent.recipient,
      occasion: localIntent.occasion
    };
  } catch (err) {
    console.log("Gemini unavailable or returned invalid JSON. Using local intent baseline fallback.", err);
    return localIntent;
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

  if (lower.includes("mother") || lower.includes("mom") || lower.includes("ammi") || lower.includes("amma")) {
    return [
      { query: "mother gift", category: "mother" },
      { query: "flowers", category: "flowers" },
      { query: "chocolate", category: "chocolates" },
      { query: "gift set", category: "Giftset" },
    ];
  }

  if (lower.includes("birthday") || lower.includes("upandinaya") || lower.includes("pirandhanaal")) {
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
    category: intent.category || null,
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
      category: search.category || null,
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

function createFallbackReply(products, language) {
  if (language === "sinhala") {
    if (products.length > 0) {
      return `මම ඔබ වෙනුවෙන් ගැලපෙන කප්රුක නිෂ්පාදන ${products.length}ක් සොයා ගත්තා. කරුණාකර පහත දැක්වෙන නිෂ්පාදන කාඩ්පත් පරීක්ෂා කරන්න.`;
    }
    return `කනගාටුයි, ගැලපෙන කප්රුක නිෂ්පාදන සොයා ගැනීමට නොහැකි විය. කරුණාකර වෙනත් නමකින් සොයන්න.`;
  } else if (language === "singlish") {
    if (products.length > 0) {
      return `Hari! Oyage request ekata galapena products ${products.length}ak mama hoyagaththa. Pahala thiyena product cards check karala balanna.`;
    }
    return `Kanalgathui, galapena Kapruka products mukuth hoyaganna bari una. Wena search ekakin try karanna.`;
  } else if (language === "tamil") {
    if (products.length > 0) {
      return `உங்களுக்குப் பொருத்தமான ${products.length} தயாரிப்புகளை நான் கண்டுபிடித்துள்ளேன். தயவுசெய்து கீழே உள்ள அட்டைகளை சரிபார்க்கவும்.`;
    }
    return `வருந்துகிறோம், பொருத்தமான தயாரிப்புகள் எதுவும் கிடைக்கவில்லை. வேறு தேடலை முயற்சிக்கவும்.`;
  } else if (language === "tanglish") {
    if (products.length > 0) {
      return `Ungluku poruthamana ${products.length} Kapruka products kandupdichen. Keela irukira cards check panni parunga.`;
    }
    return `Manthukiren, poruthamana products ethuvum kidaikala. Vera query try panni parunga.`;
  } else {
    if (products.length > 0) {
      return `I found ${products.length} matching Kapruka products for you. Please check the product cards below.`;
    }
    return `I couldn't find matching Kapruka products. Please try a different or more specific request.`;
  }
}

async function createAiReply(message, intent, products) {
  const language = intent.language || "english";
  
  try {
    let languageInstruction = "Reply briefly in 1-2 sentences only. Do not list all products. The frontend will display the product cards separately.";
    
    if (language === "sinhala") {
      languageInstruction += "\nYou MUST reply in Sinhala language Unicode. Sound polite, warm, and helpful (e.g. 'ඔබගේ අම්මා සඳහා සුදුසු උපන්දින තෑගි කිහිපයක් සොයාගත්තා. පහතින් බලන්න.').";
    } else if (language === "singlish") {
      languageInstruction += "\nYou MUST reply in conversational Singlish (Sinhala written in English letters). Sound warm and friendly (e.g. 'Hari! Oyage amma ta galapena birthday gifts tikak hoyagena thiyenawa. Pahalin balanna.').";
    } else if (language === "tamil") {
      languageInstruction += "\nYou MUST reply in Tamil language Unicode. Sound polite, warm, and helpful (e.g. 'உங்களுக்குப் பொருத்தமான தயாரிப்புகள் சிலவற்றைக் கண்டறிந்துள்ளேன். கீழே பார்க்கவும்.').";
    } else if (language === "tanglish") {
      languageInstruction += "\nYou MUST reply in conversational Tanglish (Tamil written in English letters). Sound warm and friendly (e.g. 'Amma ku birthday gift kandupdichen. Keela check panni parunga.').";
    } else {
      languageInstruction += "\nReply in standard English.";
    }

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

${languageInstruction}
`,
    });

    return response.text || createFallbackReply(products, language);
  } catch {
    console.log("Gemini unavailable. Using template reply.");
    return createFallbackReply(products, language);
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