import { createHash, timingSafeEqual } from "crypto";

export function generateHash(str) {
  return createHash("sha256").update(str).digest("hex");
}

export function validateHash(hash1, hash2) {
  if (typeof hash1 !== "string" || typeof hash2 !== "string") return false;
  if (hash1.length !== 64 || hash2.length !== 64) return false;

  try {
    const buf1 = Buffer.from(hash1, "hex");
    const buf2 = Buffer.from(hash2, "hex");

    return timingSafeEqual(buf1, buf2);
  } catch (err) {
    console.error(err);
    return false;
  }
}
