function decodeBase64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return atob(base64);
  } catch (e) {
    console.error("Failed to decode base64:", e);
    return null;
  }
}

function decodeMcpToken(token) {
  try {
    const [payload] = token.split(".");
    if (!payload) throw new Error("Invalid structure.");

    const decodedPayload = decodeBase64Url(payload);

    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

function checkTimestamp() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("mcp_token");

  if (!token) {
    return (window.location.href = "/html/error/?id=5");
  }

  const payload = decodeMcpToken(token);

  if (!payload || !payload.ts) {
    return (window.location.href = "/html/error/?id=2");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const oneHourAgo = currentTime - 3600;

  if (payload.ts < oneHourAgo) {
    return (window.location.href = "/html/error/?id=1");
  }

  window.user_id = payload.sid;
}

checkTimestamp();
