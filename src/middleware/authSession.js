import path from "path";

function decodeBase64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf8");
}

function decodePayloadOnly(token) {
  try {
    const [payload] = token.split(".");
    if (!payload) throw new Error("Invalid structure.");

    const decodedPayload = decodeBase64Url(payload);
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

export function checkTimestamp(req, res, next) {
  const token = req.query["mcp_token"];

  if (!token) {
    return res.redirect("/html/error/?id=5");
  }

  const payload = decodePayloadOnly(token);

  if (!payload || !payload.ts) {
    return res.redirect("/html/error/?id=2");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const oneHourAgo = currentTime - 3600;

  if (payload.ts < oneHourAgo) {
    return res.redirect("/html/error/?id=1");
  }

  next();
}
