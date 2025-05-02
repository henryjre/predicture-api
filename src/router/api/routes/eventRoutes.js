import { Router } from "express";
import {
  eventReceive,
  getChartData,
} from "../../../controllers/eventController.js";

const router = Router();

// POST /api/events/trade
router.post("/trade", eventReceive);

// GET /api/events/{event_id}/prices
router.get("/:event_id/prices", getChartData);

export default router;
