const express = require("express");
const jwt = require("jsonwebtoken");
const SOSAlert = require("../models/SOSAlert");

const router = express.Router();

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue.",
      });
    }

    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

// POST /api/sos
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      category,
      description,
      location,
      forWhom,
    } = req.body;

    const validCategories = [
      "Vehicle Issue",
      "Sickness/Injury",
      "Crime",
      "Lost/Trapped",
      "Fire",
      "Other",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid SOS category.",
      });
    }

    const latitude = location?.latitude;
    const longitude = location?.longitude;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid latitude and longitude are required.",
      });
    }

    const alert = await SOSAlert.create({
      user: req.user.id,
      category,
      description,
      location: { latitude, longitude },
      forWhom: ["Me", "Someone else", "Multiple people"].includes(forWhom)
        ? forWhom
        : "Me",
    });

    return res.status(201).json({
      success: true,
      message: "SOS alert saved successfully.",
      alert,
    });
  } catch (error) {
    console.error("SOS creation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not create SOS alert.",
    });
  }
});

// GET /api/sos/my-alerts
router.get("/my-alerts", authenticate, async (req, res) => {
  try {
    const alerts = await SOSAlert.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("SOS history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch SOS history.",
    });
  }
});

module.exports = router;