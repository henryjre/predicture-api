import express from "express";
import apiRouter from "./api/index.js";
import { home } from "../controllers/homeController.js";
import { authenticateApiKey } from "../middleware/authCalls.js";
import { dynamicLimiter } from "../middleware/rateLimiter.js";
import path from "path";
import { fileURLToPath } from "url";
import { checkTimestamp } from "../middleware/authSession.js";
// emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Mount all API routes under /api
router.use("/api", apiRouter);

// Serve specific static routes with middleware
router.use(
  "/html/trade",
  checkTimestamp,
  express.static(path.join(__dirname, "public/trade"))
);

// Serve static files
router.use(
  "/html",
  dynamicLimiter,
  express.static(path.join(__dirname, "../../public"))
);

// Getting the /api endpoint
router.get("/api", home);

export default router;
