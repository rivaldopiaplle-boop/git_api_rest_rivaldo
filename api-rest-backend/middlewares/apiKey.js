const dotenv = require("dotenv");
dotenv.config();

const store = require("../db/foodsStore");
const expected = process.env.API_KEY || "";

module.exports = async function apiKeyMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!expected && !key) {
    console.warn(
      "Warning: API_KEY not set in environment and no x-api-key provided; allowing request",
    );
    return next();
  }

  if (expected && key === expected) return next();

  if (key) {
    try {
      const foods = await store.listFoods({ includeApiKey: true });
      const found = foods.some((f) => f.apiKey === key);
      if (found) return next();
    } catch (err) {
      console.error("Error checking per-food apiKey:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(401).json({ error: "Invalid API key" });
};
