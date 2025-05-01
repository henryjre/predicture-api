import { Router } from "express";
import apiRouter from "./api/index.js";
import htmlRouter from "./html/index.js";
import { home } from "../controllers/homeController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Mount all HTML routes under /html
router.use("/html", htmlRouter);

// Mount all API routes under /api
router.use("/api", apiRouter);

// Getting the /api endpoint
router.get("/api", home);

export default router;
