import express from "express";
import apiRouter from "./api/index.js";
import { home } from "../controllers/homeController.js";
import { authenticateApiKey } from "../middleware/authMiddleware.js";
import { dynamicLimiter } from "../middleware/rateLimiter.js";
import path from "path";
import { fileURLToPath } from "url";

import csrf from "csurf";

// emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

// Mount all API routes under /api
router.use("/api", apiRouter);

// Serve static files
router.use(
  "/html",
  dynamicLimiter,
  apiRouter,
  express.static(path.join(__dirname, "../../public"))
);

// Getting the /api endpoint
router.get("/api", home);

export default router;
