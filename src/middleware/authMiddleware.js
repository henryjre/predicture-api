// src/middleware/auth.js
const VALID_API_KEY = process.env.API_KEY;

export const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"]; // Use 'x-api-key' header

  if (!apiKey) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No API key provided" });
  }

  if (apiKey !== VALID_API_KEY) {
    return res.status(403).json({ message: "Forbidden: Invalid API key" });
  }

  next();
};
