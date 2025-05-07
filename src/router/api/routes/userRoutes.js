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

router.get("/error", (req, res) => {
  res.status(404).json({ ok: false, message: "Invalid request." });
});

export default router;
