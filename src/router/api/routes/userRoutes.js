// routes/userPositionsRoutes.js
import express from "express";
import {
  getUserMarketData,
  openPositions,
  updateAmountInput,
} from "../../../controllers/userController.js";
import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

// GET /api/users/positions/open/:userId
router.get("/positions/open/:userId", openPositions);

// GET /api/users/market_data
router.post("/market_data", authenticateUser, getUserMarketData);

// GET /api/users/updateAmountInput
router.get("/updateAmountInput", updateAmountInput);

export default router;
