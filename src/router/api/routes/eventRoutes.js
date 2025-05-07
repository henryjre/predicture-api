import { Router } from "express";
import {
  eventReceive,
  getChartData,
  getEventData,
  getCurrenMarketData,
} from "../../../controllers/eventController.js";
import {
  dynamicLimiter,
  tradeRateLimiter,
} from "../../../middleware/rateLimiter.js";

const router = Router();

// POST /api/events/trade
router.post("/trade", tradeRateLimiter, eventReceive);

// GET /api/events/{event_id}/prices
router.get("/:event_id/prices", dynamicLimiter, getChartData);

// GET /api/events/{event_id}/prices
router.get("/:event_id/current_market", dynamicLimiter, getCurrenMarketData);

// GET /api/events/{event_id}/data
router.get("/:event_id/data", dynamicLimiter, getEventData);

export default router;
