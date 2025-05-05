import { Router } from "express";
import {
  eventReceive,
  getChartData,
  getEventData,
  getCurrentPrices,
} from "../../../controllers/eventController.js";

const router = Router();

// POST /api/events/trade
router.post("/trade", eventReceive);

// GET /api/events/{event_id}/prices
router.get("/:event_id/prices", getChartData);

// GET /api/events/{event_id}/prices
router.get("/:event_id/current_market", getCurrentPrices);

// GET /api/events/{event_id}/data
router.get("/:event_id/data", getEventData);

export default router;
