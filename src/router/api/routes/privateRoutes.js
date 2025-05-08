// routes/userPositionsRoutes.js
import express from "express";
import {
  createUserData,
  rotateToken,
} from "../../../controllers/userController.js";

const router = express.Router();

// POST /api/private/createUserData
router.post("/createUserData", createUserData);

// POST /api/private/rotateToken
router.post("/rotateToken", rotateToken);

export default router;
