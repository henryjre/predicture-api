import { Router } from "express";
import eventRoutes from "./routes/eventRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import privateRoutes from "./routes/privateRoutes.js";
import {
  authenticateApiKey,
  authenticateUser,
} from "../../middleware/authentication.js";

const router = Router();

// /api/events/*
router.use("/events", eventRoutes);

// /api/users/*
router.use("/users", authenticateUser, userRoutes);

// /api/private/*
router.use("/private", authenticateApiKey, privateRoutes);

export default router;
