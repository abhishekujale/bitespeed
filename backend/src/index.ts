import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import identifyRouter from "./routes/identify";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/", identifyRouter);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
