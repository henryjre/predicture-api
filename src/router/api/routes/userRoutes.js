// routes/userPositionsRoutes.js
import express from "express";
import {
  getUserMarketData,
  openPositions,
} from "../../../controllers/userController.js";

const router = express.Router();

// GET /api/user/positions/open/:userId
router.get("/positions/open/:userId", openPositions);

// GET /api/user/positions/open/:userId
router.get("/market_data", getUserMarketData);

export default router;
