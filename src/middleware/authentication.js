import moment from "moment";
import { decodeBase64Token } from "../utils/hash.js";
import jwt from "jsonwebtoken";
import pool from "../database/db.js";

// Helper function to check if timestamp is more than 1 hour old
function isOneHourAgo(unixTimestamp) {
  const oneHourAgo = moment().subtract(1, "hours");
  const timestamp = moment.unix(unixTimestamp);
  return timestamp.isBefore(oneHourAgo);
}

export const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"]; // Use 'x-api-key' header

  if (!apiKey) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No API key provided" });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: "Forbidden: Invalid API key" });
  }

  next();
};

export const authenticateUser = async (req, res, next) => {
  const { mcp_token, user_token } = req.query;

  if (!mcp_token || !user_token) {
    res.redirect(
      `/html/error?id=5&mcp_token=${mcp_token}&user_token=${user_token}`
    );
    return;
  }

  try {
    const decodedMcpToken = decodeBase64Token(mcp_token);

    if (!decodedMcpToken) {
      return res.redirect(
        `/html/error?id=8&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    if (!decodedMcpToken.sid) {
      res.redirect(
        `/html/error?id=5&mcp_token=${mcp_token}&user_token=${user_token}`
      );
      return;
    }

    const tokenTimestamp = decodedMcpToken.ts;

    if (isOneHourAgo(tokenTimestamp)) {
      return res.redirect(
        `/html/error?id=6&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    const decodedJwtToken = jwt.verify(user_token, process.env.JWT_SECRET);
    const { uid, iat } = decodedJwtToken;

    if (String(uid) !== String(decodedMcpToken.sid)) {
      return res.redirect(
        `/html/error?id=8&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    const ipAddress = extractIPv4(req.ip) || "0.0.0.0";

    console.log("ipAddress", ipAddress);

    // Database Check: Verify the token in the database
    const query = `
      SELECT token, ip_address, date_created 
      FROM jwt_tokens 
      WHERE user_id = $1;
    `;

    const { rows } = await pool.query(query, [uid]);
    const { token, ip_address, date_created } = rows[0];

    if (token !== user_token) {
      console.log("JWT mismatch");
      return res.redirect(
        `/html/error?id=8&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    if (ip_address !== ipAddress) {
      console.log("IP mismatch");
      return res.redirect(
        `/html/error?id=2&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    req.user = { user_id: uid };
    next();
  } catch (err) {
    console.log("Error in authentication:", err);
    if (err.name === "TokenExpiredError") {
      return res.redirect(
        `/html/error?id=6&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    return res.redirect(
      `/html/error?id=8&mcp_token=${mcp_token}&user_token=${user_token}`
    );
  }

  function extractIPv4(ip) {
    if (ip.startsWith("::ffff:")) {
      return ip.split("::ffff:")[1];
    }
    return ip;
  }
};
