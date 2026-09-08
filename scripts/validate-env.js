import "dotenv/config";

// MONGODB_URI is the primary requirement for database persistence
const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri || mongodbUri.trim() === "") {
  console.error("Environment variable MONGODB_URI is not set. Please configure MONGODB_URI in your .env file.");
  process.exit(1);
}

// Optional services
const googleGeminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!googleGeminiApiKey) {
  console.log("Notice: GOOGLE_GEMINI_API_KEY is not set. AI translation will use fallback mode.");
}

console.log("Environment validation passed.");
