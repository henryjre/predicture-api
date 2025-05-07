import rateLimit from "express-rate-limit";

export const dynamicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    const extension = path.extname(req.path);
    if (extension === ".jpg" || extension === ".png") {
      return 50; // Lower limit for images
    }
    return 100;
  },
  message: "Rate limit exceeded. Try again later.",
});

export const tradeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 5 requests per minute per IP
  message: {
    status: 429,
    message: "Too many trades. Please try again later.",
  },
});
