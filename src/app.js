import express from "express";
import cors from "cors";
// import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./router/index.js";

const app = express();

// Trust proxy - needed for rate limiter to work behind a proxy
app.set("trust proxy", 1);

app.use(cors());
app.use(cookieParser());
app.use(express.json());
// app.use(morgan("dev"));

app.use("/", routes);

export default app;
