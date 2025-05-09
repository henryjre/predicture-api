import express from "express";
import apiRouter from "./api/index.js";
import { home } from "../controllers/homeController.js";
import {
  authenticateApiKey,
  authenticateUser,
} from "../middleware/authentication.js";
import { dynamicLimiter } from "../middleware/rateLimiter.js";
import path from "path";
import { fileURLToPath } from "url";
// emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Mount all API routes under /api
router.use("/api", apiRouter);

// Serve the main trade page with authentication
if (process.env.NODE_ENV === "production") {
  router.get("/html/trade", dynamicLimiter, authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/trade/index.html"));
  });
}

// Serve static files for trade without authentication
router.use(
  "/html/trade",
  express.static(path.join(__dirname, "../../public/trade"))
);

// Serve static files
router.use("/html", express.static(path.join(__dirname, "../../public")));

// Getting the /api endpoint
router.get("/api", home);

export default router;
