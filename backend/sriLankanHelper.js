/**
 * Sri Lankan Localizer Baseline Helper
 * Handles language detection, vocabulary mapping, budget extraction, relative dates,
 * and city recognition for Sinhala and Tanglish queries.
 */

// 1. Language Detection
export function detectLanguage(message) {
  if (!message) return "english";
  
  // Sinhala Unicode range check
  if (/[\u0D80-\u0DFF]/.test(message)) {
    return "sinhala";
  }

  // Tanglish keywords lookup
  const tanglishKeywords = [
    "ona", "one", "epaa", "yavanna", "yawanna", "karanna", "puluwanda", "puluwada", "mata", "ekak", "wenakan", 
    "idan", "heta", "anidda", "ada", "thaththa", "thaththi", "appachchi", "amma", "ammi", "malli", "nangi", 
    "akka", "aiya", "thaththata", "ammata", "nangita", "akkata", "mallita", "aiyata", "ta", "mal", "tikak", 
    "aduen", "aduwen", "wada", "wedi", "wedipura", "lkr", "rs", "rupeel", "yawala", "yawanna", "ewanna"
  ];
  
  const words = message.toLowerCase().split(/[^\w]+/);
  const hasTanglish = words.some(w => tanglishKeywords.includes(w) || w.endsWith("ta") || w.endsWith("la"));
  
  if (hasTanglish) {
    return "tanglish";
  }
  
  return "english";
}

// 2. Recipient and Occasion Helper Maps
export function getRecipientAndOccasionFromText(message) {
  if (!message) return { recipient: "General", occasion: "Gift Shopping" };
  const lower = message.toLowerCase();

  // Recipient maps (base + suffixed)
  const recipientMap = [
    { words: ["mother", "mom", "mum", "amma", "ammi", "ammata", "ammita", "අම්මා", "අම්මට", "මවු"], value: "Mother" },
    { words: ["father", "dad", "thatha", "thaththi", "appachchi", "thaththata", "appachchita", "තාත්තා", "තාත්තට", "පියා"], value: "Father" },
    { words: ["younger sister", "nangi", "nangita", "නංගි", "නංගිට"], value: "Younger Sister" },
    { words: ["older sister", "akka", "akkata", "අක්කා", "අක්කට"], value: "Older Sister" },
    { words: ["younger brother", "malli", "mallita", "මල්ලි", "මල්ලිට"], value: "Younger Brother" },
    { words: ["older brother", "aiya", "aiyata", "අයියා", "අයියට"], value: "Older Brother" },
    { words: ["wife", "wifeta", "birinda", "birindata", "බිරිඳ", "බිරිඳට"], value: "Wife" },
    { words: ["husband", "husbandta", "samiya", "samiyata", "සැමියා", "සැමියට"], value: "Husband" },
    { words: ["girlfriend", "girl friend", "gf", "gfta", "girlfriendta", "බිරිඳ", "ආදරවන්තිය"], value: "Girlfriend" },
    { words: ["boyfriend", "boy friend", "bf", "bfta", "boyfriendta", "ආදරවන්තයා"], value: "Boyfriend" },
    { words: ["friend", "yaluwa", "yaluwata", "mithura", "mithurata", "මිතුරා", "යාලුවා", "මිතුරට"], value: "Friend" },
    { words: ["kid", "kids", "child", "children", "daruwa", "daruwata", "putha", "duwa", "දරුවා", "පුතා", "දුව"], value: "Children" }
  ];

  let recipient = "General";
  for (const item of recipientMap) {
    if (item.words.some(word => lower.includes(word))) {
      recipient = item.value;
      break;
    }
  }

  // Occasion maps
  const occasionMap = [
    { words: ["birthday", "upandinaya", "upandinayata", "උපන්දිනය", "උපන්දිනයට"], value: "Birthday" },
    { words: ["anniversary", "warshika samaruma", "samarumata", "සැමරුම", "සැමරුමට"], value: "Anniversary" },
    { words: ["mothers day", "mother's day", "amma ge dawasa", "මව්වරුන්ගේ දිනය"], value: "Mother's Day" },
    { words: ["fathers day", "father's day", "thaththa ge dawasa", "තාත්තාගේ දිනය"], value: "Father's Day" },
    { words: ["valentine", "valentines", "lover", "lovers", "ආදරවන්තයින්ගේ"], value: "Valentine's" }
  ];

  let occasion = "Gift Shopping";
  for (const item of occasionMap) {
    if (item.words.some(word => lower.includes(word))) {
      occasion = item.value;
      break;
    }
  }

  return { recipient, occasion };
}

// 3. Category Mapper
export function mapCategoryAndQuery(message) {
  if (!message) return { query: "gift", category: null };
  const lower = message.toLowerCase();

  const categoryMap = [
    { words: ["mal", "mal tikak", "flower", "flowers", "මල්"], category: "flowers", query: "flowers" },
    { words: ["cake", "cakes", "kek", "කේක්"], category: "cakes", query: "cake" },
    { words: ["chocolate", "chocolates", "choco", "චොකලට්"], category: "chocolates", query: "chocolate" },
    { words: ["toy", "toys", "sellam badu", "sellam", "සෙල්ලම් බඩු", "සෙල්ලම්"], category: "KidsToys", query: "toys" },
    { words: ["perfume", "perfumes", "sent", "සුවඳ විලවුන්", "සුවඳ"], category: "Perfumes", query: "perfume" },
    { words: ["book", "books", "potha", "poth", "පොත", "පොත්"], category: "Books", query: "books" },
    { words: ["fruit", "fruits", "palathuru", "පලතුරු"], category: "Fruits", query: "fruits" },
    { words: ["jewellery", "jewelry", "abharana", "ආභරණ"], category: "Jewellery", query: "jewellery" }
  ];

  for (const item of categoryMap) {
    if (item.words.some(word => lower.includes(word))) {
      return { query: item.query, category: item.category };
    }
  }

  return { query: "gift", category: null };
}

// 4. Budget Extraction Rules
export function extractBudget(message) {
  const result = { minPrice: null, maxPrice: null };
  if (!message) return result;

  const lower = message.toLowerCase();

  // Range Extraction Patterns:
  // e.g. "5000-10000", "5000 idan 10000 wenakan", "රු 5000 සිට 10000 දක්වා"
  const rangeRegex = /(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})\s*(?:-|to|and|sita|සිට|idan|ඉඳන්|sita|දක්වා|wenakan|වෙනකන්)\s*(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})/i;
  const rangeMatch = lower.match(rangeRegex);
  if (rangeMatch) {
    result.minPrice = Number(rangeMatch[1]);
    result.maxPrice = Number(rangeMatch[2]);
    return result;
  }

  // Under / Less Than Patterns:
  // e.g. "5000 ta aduwen", "under 5000", "5000ට අඩු", "5000 ta wada adu"
  const underRegex = /(?:under|below|less than|adu|aduwen|අඩු|අඩුවෙන්|max|maximum)\s*(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})/i;
  const underRegex2 = /(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})\s*(?:ta\s+aduwen|ta\s+wada\s+adu|ta\s+adu|ට\s+අඩු|ට\s+අඩුවෙන්|sita\s+adu)/i;

  const underMatch = lower.match(underRegex);
  const underMatch2 = lower.match(underRegex2);
  
  if (underMatch) {
    result.maxPrice = Number(underMatch[1]);
  } else if (underMatch2) {
    result.maxPrice = Number(underMatch2[1]);
  }

  // Over / More Than Patterns:
  // e.g. "5000 ta wada wedi", "over 5000", "5000 ta wedi", "5000ට වැඩි"
  const overRegex = /(?:over|above|more than|wedi|wedipura|වැඩි|වැඩියෙන්|min|minimum)\s*(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})/i;
  const overRegex2 = /(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})\s*(?:ta\s+wada\s+wedi|ta\s+wedi|ට\s+වැඩි|ට\s+වැඩියෙන්)/i;

  const overMatch = lower.match(overRegex);
  const overMatch2 = lower.match(overRegex2);
  
  if (overMatch) {
    result.minPrice = Number(overMatch[1]);
  } else if (overMatch2) {
    result.minPrice = Number(overMatch2[1]);
  }

  // Single price fallback (e.g. "lkr 5000", "rs 5000")
  if (result.minPrice === null && result.maxPrice === null) {
    const singleRegex = /(?:rs\.?|lkr|රු\.?|රුපියල්)\s*(\d{3,7})/i;
    const singleMatch = lower.match(singleRegex);
    if (singleMatch) {
      result.maxPrice = Number(singleMatch[1]);
    }
  }

  return result;
}

// 5. Date Suggester
export function extractDeliveryDate(message) {
  if (!message) return null;
  const lower = message.toLowerCase();
  
  const today = new Date();
  // Timezone offset for Sri Lanka (UTC+5:30)
  const offset = 5.5 * 60 * 60 * 1000;
  const colomboTime = new Date(today.getTime() + offset);

  const formatDate = (d) => d.toISOString().split("T")[0];

  if (lower.includes("ada") || lower.includes("today") || lower.includes("අද") || lower.includes("same day") || lower.includes("same-day")) {
    return formatDate(colomboTime);
  }
  if (lower.includes("heta") || lower.includes("tomorrow") || lower.includes("හෙට")) {
    const tomorrow = new Date(colomboTime.getTime() + 24 * 60 * 60 * 1000);
    return formatDate(tomorrow);
  }
  if (lower.includes("anidda") || lower.includes("day after tomorrow") || lower.includes("අනිද්දා")) {
    const dayAfter = new Date(colomboTime.getTime() + 2 * 24 * 60 * 60 * 1000);
    return formatDate(dayAfter);
  }

  return null;
}

// 6. City Parser
export function extractCity(message) {
  if (!message) return null;
  const lower = message.toLowerCase();

  const cityMap = {
    "colombo": "Colombo", "kolamba": "Colombo", "කොළඹ": "Colombo",
    "kandy": "Kandy", "nuwara": "Kandy", "mahanuwara": "Kandy", "මහනුවර": "Kandy",
    "galle": "Galle", "gaalla": "Galle", "ගාල්ල": "Galle",
    "negombo": "Negombo", "meegamuwa": "Negombo", "මීගමුව": "Negombo",
    "kurunegala": "Kurunegala", "කුරුණෑගල": "Kurunegala"
  };

  for (const key of Object.keys(cityMap)) {
    if (lower.includes(key)) {
      return cityMap[key];
    }
  }

  return null;
}

// 7. General Normalization Layer
export function normalizeMessageToIntent(message) {
  const language = detectLanguage(message);
  const budget = extractBudget(message);
  const deliveryDate = extractDeliveryDate(message);
  const city = extractCity(message);
  const categoryAndQuery = mapCategoryAndQuery(message);
  const { recipient, occasion } = getRecipientAndOccasionFromText(message);

  let searchPhrase = categoryAndQuery.query;
  if (searchPhrase === "gift") {
    // If no specific category was matched, make a search query from occasion + recipient
    if (recipient !== "General" || occasion !== "Gift Shopping") {
      searchPhrase = `${recipient} ${occasion !== "Gift Shopping" ? occasion : "gift"}`.trim().toLowerCase();
    }
  }

  return {
    language,
    query: searchPhrase,
    category: categoryAndQuery.category,
    minPrice: budget.minPrice,
    maxPrice: budget.maxPrice,
    deliveryDate,
    city,
    recipient,
    occasion
  };
}
