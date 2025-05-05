import { Router } from "express";
import eventRoutes from "./routes/eventRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const router = Router();

// /api/events/*
router.use("/events", eventRoutes);

// /api/users/positions*
router.use("/users", userRoutes);

export default router;
