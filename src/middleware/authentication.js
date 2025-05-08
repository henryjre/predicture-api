import moment from "moment";
import { decodeBase64Token } from "../utils/hash.js";
import jwt from "jsonwebtoken";

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

export const authenticateUser = (req, res, next) => {
  const { mcp_token, user_token } = req.query;

  console.log("Received tokens:", { user_token, mcp_token });

  if (!mcp_token || !user_token) {
    console.log("Missing tokens");
    res.redirect(
      `/html/error?id=5&mcp_token=${mcp_token}&user_token=${user_token}`
    );
    return;
  }

  try {
    const decodedMcpToken = decodeBase64Token(mcp_token);
    console.log("Decoded MCP token:", decodedMcpToken);

    if (!decodedMcpToken) {
      console.log("Invalid MCP token");
      return res.redirect(
        `/html/error?id=8&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    if (!decodedMcpToken.sid) {
      console.log("Missing sid in MCP token");
      res.redirect(
        `/html/error?id=5&mcp_token=${mcp_token}&user_token=${user_token}`
      );
      return;
    }

    const tokenTimestamp = decodedMcpToken.ts;
    console.log("Token timestamp:", tokenTimestamp);

    if (isOneHourAgo(tokenTimestamp)) {
      console.log("Token expired (1 hour)");
      return res.redirect(
        `/html/error?id=6&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    const decodedJwtToken = jwt.verify(user_token, process.env.HASH_SECRET);
    const { uid, iat } = decodedJwtToken;

    if (String(uid) !== String(decodedMcpToken.sid)) {
      console.log("User ID mismatch:", {
        jwtUserId: uid,
        mcpSid: decodedMcpToken.sid,
        types: {
          jwtType: typeof uid,
          mcpType: typeof decodedMcpToken.sid,
        },
      });

      return res.redirect(
        `/html/error?id=8&mcp_token=${mcp_token}&user_token=${user_token}`
      );
    }

    const oneHourAgo = Date.now() - 3600 * 1000;

    if (iat < oneHourAgo) {
      console.log("Token expired (1 hour)");
      return res.redirect(
        `/html/error?id=6&mcp_token=${mcp_token}&user_token=${user_token}`
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
};
