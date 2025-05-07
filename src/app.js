import express from "express";
import cors from "cors";
// import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import routes from "./router/index.js";

const app = express();

app.use(
  session({
    secret: process.env.HASH_SECRET, // Use a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60 * 1000, // 30 minutes
    },
  })
);

app.use(cors());
app.use(cookieParser());
app.use(express.json());
// app.use(morgan("dev"));

app.use("/", routes);

export default app;
