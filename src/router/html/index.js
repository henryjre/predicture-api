import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

// These two lines emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// /html/charts
router.get("/charts", (req, res) => {
  res.sendFile(path.join(__dirname, "./routes/price_timeline.html"));
});

export default router;
