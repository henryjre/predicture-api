function decodeBase64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf8");
}

function decodeMcpToken(token) {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("mcp_token");

  try {
    const [payload] = token.split(".");

    const decodedPayload = decodeBase64Url(payload);
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

function checkTimestamp() {
  if (!token) {
    return res.redirect("/html/error/?id=5");
  }

  const payload = decodeMcpToken(token);

  if (!payload || !payload.ts) {
    return res.redirect("/html/error/?id=2");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const oneHourAgo = currentTime - 3600;

  if (payload.ts < oneHourAgo) {
    return res.redirect("/html/error/?id=1");
  }

  window.user_id = payload.user_id;
}
