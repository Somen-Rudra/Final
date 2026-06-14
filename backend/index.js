import express from "express";
import ENV from "./config/env.js";
import { connectMongoDB, connectRedis } from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// routes
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import problemRouter from "./routes/problemRoutes.js"

const app = express();

// middlewares
app.use(morgan("dev"));
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials:true,
    methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/problemSet", problemRouter);

const startServer = async () => {
  try {
    await connectMongoDB();
    await connectRedis(); 

    app.listen(ENV.PORT, () => {
      console.log(`Server: http://localhost:${ENV.PORT}`);
    });
  } catch (error) {
    console.log(`Server: ${error.message}`);
  }
};

startServer();