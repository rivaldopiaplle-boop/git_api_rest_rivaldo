const dotenv = require("dotenv");
dotenv.config();

const expected = process.env.API_KEY || "";

module.exports = async function apiKeyMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!expected) {
    return res.status(500).json({
      error: "API key not configured",
      details:
        "Set API_KEY in the backend environment before calling /api routes.",
    });
  }

  if (key === expected) return next();

  return res.status(401).json({ error: "Invalid API key" });
};
