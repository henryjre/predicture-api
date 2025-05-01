import { Router } from "express";
import eventRoutes from "./routes/eventRoutes.js";

const router = Router();

// Example: /api/events/*
router.use("/events", eventRoutes);

export default router;
