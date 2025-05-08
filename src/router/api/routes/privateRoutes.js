// routes/userPositionsRoutes.js
import express from "express";
import {
  createUserData,
  rotateToken,
} from "../../../controllers/userController.js";
import { eventReceive } from "../../../controllers/eventController.js";
import { authenticateApiKey } from "../../../middleware/authentication.js";

const router = express.Router();

// POST /api/private/createUserData
router.post("/createUserData", authenticateApiKey, createUserData);

// POST /api/private/rotateToken
router.post("/rotateToken", authenticateApiKey, rotateToken);

// POST /api/events/trade
router.post("/trade", eventReceive);

export default router;
