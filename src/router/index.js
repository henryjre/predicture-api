import { Router, static as static_ } from "express";
import apiRouter from "./api/index.js";
import { home } from "../controllers/homeController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";

// emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Mount all API routes under /api
router.use("/api", apiRouter);

// Serve static files from the public directory
router.use("/html", static_(path.join(__dirname, "../../public")));

// Getting the /api endpoint
router.get("/api", home);

export default router;
