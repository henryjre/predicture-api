// routes/userPositionsRoutes.js
import express from "express";
import {
  createUserData,
  samplePost,
} from "../../../controllers/userController.js";
import csrf from "csurf";

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

// POST /api/private/createUserData
router.post("/createUserData", createUserData);

// POST /api/private/samplePost
router.post("/samplePost", csrfProtection, samplePost);

export default router;
