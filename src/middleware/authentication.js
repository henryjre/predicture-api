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

  if (process.env.NODE_ENV === "development") {
    console.log("API Key Authentication:", {
      receivedKey: apiKey ? "Key received" : "No key received",
      expectedKey: process.env.API_KEY ? "Key configured" : "No key configured",
      path: req.path,
      method: req.method,
    });
  }

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("Authentication failed: No API key provided");
    }
    return res
      .status(401)
      .json({ message: "Unauthorized: No API key provided" });
  }

  if (apiKey !== process.env.API_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.log("Authentication failed: Invalid API key");
    }
    return res.status(403).json({ message: "Forbidden: Invalid API key" });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("API Key Authentication successful");
  }
  next();
};

export const authenticateUser = async (req, res, next) => {
  const { mcp_token, user_token, ...rest } = req.query;
  const jwtCookieName = process.env.JWT_COOKIE_NAME;
  const jwtCookie = req.signedCookies[jwtCookieName];

  // Add detailed logging
  console.log("Authentication Debug:", {
    hasMcpToken: !!mcp_token,
    hasUserToken: !!user_token,
    hasCookie: !!jwtCookie,
    cookieName: jwtCookieName,
    signedCookies: Object.keys(req.signedCookies),
    query: req.query,
    path: req.path,
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer,
    },
  });

  // Determine the source of the JWT token
  const token = user_token || jwtCookie;

  // If `mcp_token` is not present, but a JWT cookie exists, allow the request to proceed
  if (!token) {
    console.log("No JWT token found in query params or cookie.");
    return res.redirect(`/html/error?id=5`);
  }

  try {
    let decodedMcpToken;

    // If `mcp_token` is present, validate it
    if (mcp_token) {
      decodedMcpToken = decodeBase64Token(mcp_token);

      if (!decodedMcpToken || !decodedMcpToken.sid) {
        return res.redirect(`/html/error?id=8`);
      }

      const tokenTimestamp = decodedMcpToken.ts;
      if (isOneHourAgo(tokenTimestamp)) {
        return res.redirect(`/html/error?id=6`);
      }
    }

    const decodedJwtToken = jwt.verify(token, process.env.JWT_SECRET);
    const { uid, nonce } = decodedJwtToken;

    if (!uid || !nonce) {
      console.log("Missing uid or nonce in JWT");
      return res.redirect(`/html/error?id=8`);
    }

    // If `mcp_token` was provided, ensure user ID matches
    if (mcp_token && String(uid) !== String(decodedMcpToken.sid)) {
      console.log("User ID mismatch:", {
        jwtUid: uid,
        mcpSid: decodedMcpToken.sid,
      });
      return res.redirect(`/html/error?id=8`);
    }

    const query = `
      SELECT token, latest_nonce 
      FROM jwt_tokens 
      WHERE user_id = $1;
    `;
    const { rows } = await pool.query(query, [uid]);

    if (rows.length === 0) {
      console.log("No token found in database for user:", uid);
      return res.redirect(`/html/error?id=8`);
    }

    const { token: dbToken, latest_nonce } = rows[0];

    if (dbToken !== token) {
      console.log("JWT token mismatch with database", { dbToken, token });
      return res.redirect(`/html/error?id=8`);
    }

    if (latest_nonce !== nonce) {
      console.log("Nonce mismatch", { latest_nonce, nonce });
      return res.redirect(`/html/error?id=2`);
    }

    req.user = { user_id: uid };

    // If `user_token` is present in query params, set it as a cookie
    if (user_token) {
      res.cookie(jwtCookieName, user_token, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        signed: true,
        maxAge: 60 * 60 * 1000,
        path: "/",
        domain: process.env.DOMAIN,
      });

      // Remove `user_token` and `mcp_token` from query params
      const newQuery = new URLSearchParams(rest).toString();
      const redirectUrl = newQuery
        ? `${req.path}?${newQuery}&uid=${uid}`
        : req.path;

      return res.redirect(redirectUrl);
    }

    // If using the cookie, just proceed
    return next();
  } catch (err) {
    console.log("Error in authentication:", err);

    const errorId = err.name === "TokenExpiredError" ? 6 : 8;
    return res.redirect(`/html/error?id=${errorId}`);
  }
};

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      error: "No token provided",
    });
  }

  const user_token = authHeader.split(" ")[1];

  try {
    const decodedJwtToken = jwt.verify(user_token, process.env.JWT_SECRET);
    const { uid, nonce } = decodedJwtToken;

    if (!uid || !nonce) {
      console.log("Missing uid or nonce in JWT");
      return res.status(401).json({
        ok: false,
        error: "Invalid token structure",
      });
    }

    // Database Check: Verify the token in the database
    const query = `
      SELECT token, latest_nonce 
      FROM jwt_tokens 
      WHERE user_id = $1;
    `;

    const { rows } = await pool.query(query, [uid]);

    if (rows.length === 0) {
      console.log("No token found in database for user:", uid);
      return res.status(401).json({
        ok: false,
        error: "Token not found in database",
      });
    }

    const { token, latest_nonce } = rows[0];

    if (token !== user_token) {
      console.log("JWT token mismatch with database");
      return res.status(401).json({
        ok: false,
        error: "Token mismatch",
      });
    }

    if (latest_nonce !== nonce) {
      console.log("Nonce mismatch:", {
        jwtNonce: nonce,
        dbNonce: latest_nonce,
      });
      return res.status(401).json({
        ok: false,
        error: "Invalid nonce",
      });
    }

    req.user = { user_id: uid };
    next();
  } catch (err) {
    console.log("Error in authentication:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        error: "Token expired",
      });
    }

    return res.status(401).json({
      ok: false,
      error: "Invalid token",
    });
  }
};
