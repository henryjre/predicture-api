import { Router } from "express";
import { eventReceive } from "../../../controllers/eventController.js";

const router = Router();

// POST /api/events/trade
router.post("/trade", eventReceive);

export default router;
