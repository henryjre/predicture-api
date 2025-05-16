import { Router } from "express";
import {
  getChartData,
  getEventData,
  getCurrenMarketData,
} from "../../../controllers/eventController.js";
import { dynamicLimiter } from "../../../middleware/rateLimiter.js";

const router = Router();

// GET /api/events/{event_id}/prices
router.get("/:event_id/prices", dynamicLimiter, getChartData);

// GET /api/events/{event_id}/prices
router.get("/:event_id/current_market", getCurrenMarketData);

// GET /api/events/{event_id}/data
router.get("/:event_id/data", dynamicLimiter, getEventData);

export default router;
