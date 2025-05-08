import { Router } from "express";
import eventRoutes from "./routes/eventRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import privateRoutes from "./routes/privateRoutes.js";

const router = Router();

// /api/events/*
router.use("/events", eventRoutes);

// /api/users/*
router.use("/users", userRoutes);

// /api/private/*
router.use("/private", privateRoutes);

export default router;
