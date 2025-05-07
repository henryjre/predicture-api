import express from "express";
import apiRouter from "./api/index.js";
import { home } from "../controllers/homeController.js";
import { authenticateApiKey } from "../middleware/authMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";

// emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Mount all API routes under /api
router.use("/api", apiRouter);

// Serve static files
router.use("/html", express.static(path.join(__dirname, "../../public")));

// Getting the /api endpoint
router.get("/api", home);

export default router;
