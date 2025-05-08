import express from "express";
import cors from "cors";
// import morgan from "morgan";
import routes from "./router/index.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
// app.use(morgan("dev"));

app.use("/", routes);

export default app;
