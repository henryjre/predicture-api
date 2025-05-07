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

function decodeToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("mcp_token");

  const payload = decodeMcpToken(token);

  window.user_id = payload.sid;
}

decodeToken();
