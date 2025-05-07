import jwt from "jsonwebtoken";

function decodeToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log("Decoded Payload:", decoded.payload);
    return decoded.payload;
  } catch (err) {
    console.error("Failed to decode token:", err.message);
    return null;
  }
}

// Session store setup (in-memory for example, use Redis in production)
const sessionStore = new Map();

// Modified bindTokenToSession middleware
export const bindTokenToSession = (req, res, next) => {
  const token = req.query.mca_token;

  if (!token) {
    return res.status(400).send("No token provided");
  }

  try {
    const decoded = decodeToken(token);

    // Check if token was already used (prevent replay)
    if (sessionStore.has(decoded.ax)) {
      return res.status(403).send("Token already used");
    }

    // Store token info
    req.session.userId = decoded.sid;
    req.session.tokenId = decoded.ax;
    req.session.originalIp = req.ip; // Store the initial IP

    // Register token as used
    sessionStore.set(decoded.ax, {
      userId: decoded.sid,
      ip: req.ip,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 min expiration
    });

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).send("Invalid token");
  }
};

// Enhanced validateSession middleware
export const validateSession = (req, res, next) => {
  if (!req.session.userId || !req.session.tokenId) {
    return res.status(403).send("Session expired. Please reauthenticate.");
  }

  // Check IP consistency (allow some proxies with X-Forwarded-For)
  const currentIp = req.ip;
  const originalIp = req.session.originalIp;

  // Simple IP comparison (expand for production use)
  if (currentIp !== originalIp) {
    console.warn(`IP mismatch for user ${req.session.userId}`);
    return res
      .status(403)
      .send("Session location changed. Please reauthenticate.");
  }

  // Check token is still valid in our store
  const tokenInfo = sessionStore.get(req.session.tokenId);
  if (!tokenInfo || tokenInfo.expiresAt < Date.now()) {
    return res.status(403).send("Session expired.");
  }

  next();
};

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [jti, data] of sessionStore) {
    if (data.expiresAt < now) {
      sessionStore.delete(jti);
    }
  }
}, 60 * 60 * 1000); // Run hourly
