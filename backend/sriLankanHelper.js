/**
 * Sri Lankan Multilingual Localizer Helper
 * Handles English, Sinhala, Singlish, Tamil, and Tanglish queries.
 */

// 1. Language Detection
export function detectLanguage(message) {
  if (!message) return "english";
  
  // 1. Sinhala Unicode Range
  if (/[\u0D80-\u0DFF]/.test(message)) {
    return "sinhala";
  }

  // 2. Tamil Unicode Range
  if (/[\u0B80-\u0BFF]/.test(message)) {
    return "tamil";
  }

  const lower = message.toLowerCase();
  const words = lower.split(/[^\w]+/);

  // 3. Singlish Keywords (Romanized Sinhala)
  const singlishKeywords = [
    "mama", "mata", "mage", "oya", "oyaata", "oyata", "amma", "ammi", "thaththa", "thaththi", 
    "akka", "nangi", "malli", "aiya", "hari", "ane", "mokakda", "kohomada", "gift ekak", "ona", 
    "puluwanda", "karanna", "yawanna", "ganna", "balanna", "one", "epaa", "yavanna", "mallita", 
    "nangita", "akkata", "aiyata", "ammata", "thaththata", "birinda", "putha", "duwa", "palathuru", 
    "aduen", "aduwen", "wada", "wedi", "wenakan", "idan"
  ];

  // 4. Tanglish Keywords (Romanized Tamil)
  const tanglishKeywords = [
    "enakku", "venum", "amma ku", "akka ku", "thambi", "anna", "nanri", "indru", "naalai", 
    "pookal", "parisu", "ammaku", "akkaku", "thambiku", "annaku", "veanum", "nandri", "inru", 
    "nalai", "flowergal", "parishugal", "yenakku"
  ];

  // Check word match or multi-word substring match
  const matchesSinglish = words.some(w => singlishKeywords.includes(w) || w.endsWith("ta")) || 
                          singlishKeywords.some(phrase => phrase.includes(" ") && lower.includes(phrase));
  
  const matchesTanglish = words.some(w => tanglishKeywords.includes(w) || w.endsWith("ku")) || 
                          tanglishKeywords.some(phrase => phrase.includes(" ") && lower.includes(phrase));

  if (matchesSinglish) {
    return "singlish";
  }

  if (matchesTanglish) {
    return "tanglish";
  }
  
  return "english";
}

// 2. Recipient and Occasion Helper Maps
export function getRecipientAndOccasionFromText(message) {
  if (!message) return { recipient: "General", occasion: "Gift Shopping" };
  const lower = message.toLowerCase();

  // Recipient maps (base + Singlish + Tanglish)
  const recipientMap = [
    { words: ["mother", "mom", "mum", "amma", "ammi", "ammata", "ammita", "amma ku", "ammaku", "අම්මා", "අම්මට", "அம்மா", "அம்மாவுக்கு"], value: "Mother" },
    { words: ["father", "dad", "thatha", "thaththi", "appachchi", "thaththata", "appachchita", "thaththa ku", "thaththaku", "තාත්තා", "තාත්තට", "තත්තා", "அப்பா", "அப்பாவுக்கு"], value: "Father" },
    { words: ["younger sister", "nangi", "nangita", "නංගි", "නංගිට", "தங்கை", "தங்கச்சி"], value: "Younger Sister" },
    { words: ["older sister", "akka", "akkata", "akka ku", "akkaku", "අක්කා", "අක්කට", "அக்கா", "அக்காவுக்கு"], value: "Older Sister" },
    { words: ["younger brother", "malli", "mallita", "thambi", "thambiku", "මල්ලි", "මල්ලිට", "தம்பி", "தம்பிக்கு"], value: "Younger Brother" },
    { words: ["older brother", "aiya", "aiyata", "anna", "annaku", "අයියා", "අයියට", "அண்ணன்", "அண்ணனுக்கு"], value: "Older Brother" },
    { words: ["wife", "wifeta", "birinda", "birindata", "manaivi", "බිරිඳ", "බිරිඳට", "மனைவி"], value: "Wife" },
    { words: ["husband", "husbandta", "samiya", "samiyata", "kanavan", "සැමියා", "සැමියට", "கணவன்"], value: "Husband" },
    { words: ["girlfriend", "girl friend", "gf", "gfta", "girlfriendta", "ආදරවන්තිය", "காதலி"], value: "Girlfriend" },
    { words: ["boyfriend", "boy friend", "bf", "bfta", "boyfriendta", "ආදරවන්තයා", "காதலன்"], value: "Boyfriend" },
    { words: ["friend", "yaluwa", "yaluwata", "nanban", "mithura", "මිතුරා", "යාලුවා", "நண்பன்"], value: "Friend" },
    { words: ["kid", "kids", "child", "children", "daruwa", "putha", "duwa", "pillai", "magan", "magal", "දරුවා", "පුතා", "දුව", "பிள்ளை", "மகன்", "மகள்"], value: "Children" }
  ];

  let recipient = "General";
  for (const item of recipientMap) {
    if (item.words.some(word => lower.includes(word))) {
      recipient = item.value;
      break;
    }
  }

  // Occasion maps (base + Singlish + Tanglish)
  const occasionMap = [
    { words: ["birthday", "upandinaya", "upandinayata", "pirandha naal", "pirandhanaal", "උපන්දිනය", "උපන්දිනයට", "பிறந்தநாள்"], value: "Birthday" },
    { words: ["anniversary", "warshika samaruma", "samarumata", "thirumana naal", "සැමරුම", "සැමරුමට", "திருமண நாள்"], value: "Anniversary" },
    { words: ["mothers day", "mother's day", "amma ge dawasa", "amma thina", "මව්වරුන්ගේ දිනය", "அன்னை தினம்"], value: "Mother's Day" },
    { words: ["fathers day", "father's day", "thaththa ge dawasa", "thanthai thina", "තාත්තාගේ දිනය", "தந்தை தினம்"], value: "Father's Day" },
    { words: ["valentine", "valentines", "lover", "lovers", "kadhalar", "ආදරවන්තයින්ගේ", "காதலர் தினம்"] }
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
    { words: ["mal", "mal tikak", "pookal", "flower", "flowers", "මල්", "பூக்கள்", "பூ"], category: "flowers", query: "flowers" },
    { words: ["cake", "cakes", "kek", "කේක්", "கேக்"], category: "cakes", query: "cake" },
    { words: ["chocolate", "chocolates", "choco", "චොකලට්", "சொක්ලට්", "சாக்லேட்"], category: "chocolates", query: "chocolate" },
    { words: ["toy", "toys", "sellam badu", "sellam", "vilayattu", "සෙල්ලම් බඩු", "සෙල්ලම්", "விளையாட்டு"], category: "KidsToys", query: "toys" },
    { words: ["perfume", "perfumes", "sent", "සුවඳ විලවුන්", "සුවඳ", "வாசனை திரவியம்"], category: "Perfumes", query: "perfume" },
    { words: ["book", "books", "potha", "poth", "puththagam", "පොත", "පොත්", "புத்தகம்"], category: "Books", query: "books" },
    { words: ["fruit", "fruits", "palathuru", "pazhangal", "පලතුරු", "பழங்கள்"], category: "Fruits", query: "fruits" },
    { words: ["jewellery", "jewelry", "abharana", "nagai", "ආභරණ", "நகைகள்"], category: "Jewellery", query: "jewellery" }
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
  // e.g. "5000-10000", "5000 idan 10000", "5000 sita 10000", "5000 to 10000"
  const rangeRegex = /(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})\s*(?:-|to|and|sita|සිට|idan|ඉඳන්|sita|දක්වා|wenakan|වෙනකන්|முதல்|இருந்து|வரை)\s*(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})/i;
  const rangeMatch = lower.match(rangeRegex);
  if (rangeMatch) {
    result.minPrice = Number(rangeMatch[1]);
    result.maxPrice = Number(rangeMatch[2]);
    return result;
  }

  // Under / Less Than Patterns:
  // e.g. "5000 ta aduwen", "under 5000", "5000ට අඩු", "5000 walata adu", "5000 kku kuraindha"
  const underRegex = /(?:under|below|less than|adu|aduwen|walata\s+adu|අඩු|අඩුවෙන්|max|maximum|kuraindha|குறைந்த)\s*(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})/i;
  const underRegex2 = /(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})\s*(?:ta\s+aduwen|ta\s+wada\s+adu|ta\s+adu|walata\s+adu|ට\s+අඩු|ට\s+අඩුවෙන්|kku\s+kuraindha|க்கு\s+குறைந்த)/i;

  const underMatch = lower.match(underRegex);
  const underMatch2 = lower.match(underRegex2);
  
  if (underMatch) {
    result.maxPrice = Number(underMatch[1]);
  } else if (underMatch2) {
    result.maxPrice = Number(underMatch2[1]);
  }

  // Over / More Than Patterns:
  // e.g. "5000 ta wada wedi", "over 5000", "5000 ta wedi", "5000 kku adhigama"
  const overRegex = /(?:over|above|more than|wedi|wedipura|වැඩි|වැඩියෙන්|min|minimum|adhigama|அதிகமான)\s*(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})/i;
  const overRegex2 = /(?:rs\.?|lkr|රු\.?|රුපියල්)?\s*(\d{3,7})\s*(?:ta\s+wada\s+wedi|ta\s+wedi|ට\s+වැඩි|ට\s+වැඩියෙන්|kku\s+adhigama|க்கு\s+அதிகமான)/i;

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

  if (lower.includes("ada") || lower.includes("today") || lower.includes("inru") || lower.includes("indru") || lower.includes("අද") || lower.includes("இன்று")) {
    return formatDate(colomboTime);
  }
  if (lower.includes("heta") || lower.includes("tomorrow") || lower.includes("naalai") || lower.includes("nalai") || lower.includes("හෙට") || lower.includes("நாளை")) {
    const tomorrow = new Date(colomboTime.getTime() + 24 * 60 * 60 * 1000);
    return formatDate(tomorrow);
  }
  if (lower.includes("anidda") || lower.includes("day after tomorrow") || lower.includes("අනිද්දා") || lower.includes("மற்றைய நாள்")) {
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
    "colombo": "Colombo", "kolamba": "Colombo", "කොළඹ": "Colombo", "கொழும்பு": "Colombo",
    "kandy": "Kandy", "nuwara": "Kandy", "mahanuwara": "Kandy", "මහනුවර": "Kandy", "கண்டி": "Kandy",
    "galle": "Galle", "gaalla": "Galle", "ගාල්ල": "Galle", "காலி": "Galle",
    "negombo": "Negombo", "meegamuwa": "Negombo", "මීගමුව": "Negombo", "நீர்கொழும்பு": "Negombo",
    "kurunegala": "Kurunegala", "කුරුණෑගල": "Kurunegala", "குருணாகல்": "Kurunegala"
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
