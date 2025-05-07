// routes/userPositionsRoutes.js
import express from "express";
import { createUserData } from "../../../controllers/userController.js";

const router = express.Router();

// POST /api/private/createUserData
router.post("/createUserData", createUserData);

export default router;
