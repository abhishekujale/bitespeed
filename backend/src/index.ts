import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import identifyRouter from "./routes/identify";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use("/", identifyRouter);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve React frontend
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
