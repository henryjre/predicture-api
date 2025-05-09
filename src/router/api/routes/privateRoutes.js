// routes/userPositionsRoutes.js
import express from "express";
import {
  createUserData,
  rotateToken,
} from "../../../controllers/userController.js";
import { eventReceive } from "../../../controllers/eventController.js";
import {
  authenticateApiKey,
  authenticateUser,
} from "../../../middleware/authentication.js";

const router = express.Router();

// POST /api/private/createUserData
router.post("/createUserData", authenticateApiKey, createUserData);

// POST /api/private/rotateToken
router.post("/rotateToken", authenticateApiKey, rotateToken);

// POST /api/private/trade
if (process.env.NODE_ENV === "production") {
  router.post("/trade", authenticateUser, eventReceive);
} else {
  router.post("/trade", eventReceive);
}

export default router;
