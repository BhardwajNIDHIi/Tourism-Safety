
const express = require("express");
const jwt = require("jsonwebtoken");
const SOSAlert = require("../models/SOSAlert");

const router = express.Router();

function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Invalid login token. Please sign in again.",
      });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

function requireTourist(req, res, next) {
  if (req.user.role !== "Tourist") {
    return res.status(403).json({
      success: false,
      message: "Only Tourist accounts can create SOS alerts.",
    });
  }

  next();
}

// POST /api/sos
router.post("/", authenticate, requireTourist, async (req, res) => {
  try {
    const { category, description, location, forWhom } = req.body;

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

    const validForWhom = [
      "Me",
      "Someone else",
      "Multiple people",
    ];

    const alert = await SOSAlert.create({
      user: req.user.id,
      category,
      description:
        typeof description === "string" ? description.trim() : "",
      location: { latitude, longitude },
      forWhom: validForWhom.includes(forWhom) ? forWhom : "Me",
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
router.get("/my-alerts", authenticate, requireTourist, async (req, res) => {
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
