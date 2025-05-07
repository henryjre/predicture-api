import pool from "../database/db.js";
import moment from "moment-timezone";
import { decodeBase64Token } from "../utils/hash.js";

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

export const authenticateUser = async (req, res, next) => {
  const { mcp_token } = req.query;

  if (!mcp_token) {
    res.redirect("/html/error?id=2");
    return;
  }

  try {
    // Decode the token to extract the user_id (sid)
    const decodedToken = decodeBase64Token(mcp_token);

    if (!decodedToken) {
      res.redirect("/html/error?id=5");
      return;
    }

    const userId = decodedToken.sid;
    const tokenTimestamp = decodedToken.ts;

    if (!userId) {
      res.redirect("/html/error?id=5");
      return;
    }

    const query = "SELECT token FROM users_data WHERE user_id = $1";
    const result = await pool.query(query, [userId]);

    const token = result.rows[0].token;

    if (!token || token.length === 0) {
      // If no token found, update the token column with the current token
      const insertQuery = "UPDATE users_data SET token = $1 WHERE user_id = $2";
      await pool.query(insertQuery, [mcp_token, userId]);

      req.user = { user_id: userId };
      next();
      return;
    }

    const storedToken = result.rows[0].token;
    const storedDecoded = decodeBase64Token(storedToken);
    const storedTimestamp = storedDecoded.ts;

    const tokenTime = moment(tokenTimestamp).tz("Asia/Manila");
    const storedTokenTime = moment(storedTimestamp).tz("Asia/Manila");

    if (tokenTime.isBefore(storedTokenTime)) {
      return res.redirect("/html/error?id=6");
    }

    const updateQuery = "UPDATE users_data SET token = $1 WHERE user_id = $2";
    await pool.query(updateQuery, [mcp_token, userId]);

    req.user = { user_id: userId };
    next();
  } catch (err) {
    return res.redirect("/html/error");
  }
};
