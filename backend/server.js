
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Safe Tourism Backend is running!",
  });
});

// Health-check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    message: "Safe Tourism API is ready",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Safe Tourism backend running on port ${PORT}`);
});