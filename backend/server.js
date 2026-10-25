const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const sosRoutes = require("./routes/sosRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Safe Tourism Backend is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    database:
      require("mongoose").connection.readyState === 1
        ? "Connected"
        : "Disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in backend/.env");
    }

    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Safe Tourism backend running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();