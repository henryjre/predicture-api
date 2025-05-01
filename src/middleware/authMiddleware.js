// src/middleware/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  try {
    jwt.verify(token, JWT_SECRET); // Verify token
    next(); // Pass control to route
  } catch {
    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }
};
