import { Router } from "express";
import apiRouter from "./api/index.js";
import { home } from "../controllers/homeController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Mount all API routes under /api
router.use("/api", apiRouter);

// Getting the /api endpoint
router.get("/api", home);

export default router;
