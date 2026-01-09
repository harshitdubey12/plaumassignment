import "dotenv/config";
import express from "express";
import cors from "cors";
import { processRouter } from "./routes/process.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", processRouter);

app.use((err, _req, res, _next) => {
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

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
