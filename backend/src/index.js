import "dotenv/config";
import express from "express";
import cors from "cors";
import { processRouter } from "./routes/process.js";

const app = express();


app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "https://plaumassignment.vercel.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

// Body parser
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// API routes
app.use("/api", processRouter);

// Global error handler (VERY important on Vercel)
app.use((err, _req, res, _next) => {
  console.error("Backend error:", err);

  const status =
    Number(err?.status) ||
    (err?.code === "LIMIT_FILE_SIZE" ? 413 : 0) ||
    (err?.code === "LIMIT_UNEXPECTED_FILE" ? 400 : 0) ||
    500;

  res.status(status).json({
    status: "error",
    message: err?.message || "Internal server error"
  });
});


export default app;
