// routes/userPositionsRoutes.js
import express from "express";
import { createUserData } from "../../../controllers/userController.js";

const router = express.Router();

// POST /api/users/create
router.get("/create", createUserData);

export default router;
