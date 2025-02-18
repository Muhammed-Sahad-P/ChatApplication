import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import msgRoutes from "./routes/msgRoutes";
import { CustomError } from "./utils/customError";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { initializeSocket } from "./config/socket";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

initializeSocket(httpServer);

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello world!");
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", msgRoutes);

app.use("*", (req, _res, next) => {
  next(new CustomError(`Cannot ${req.method} ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
