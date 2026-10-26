
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "Admin" || decoded.isAdmin !== true) {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Admin token is invalid or expired. Please sign in again.",
    });
  }
}

function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role,
    hotelName: user.hotelName || "",
    hotelAddress: user.hotelAddress || "",
    agentId: user.agentId || "",
    verificationStatus:
      user.verificationStatus ||
      (user.role === "Agent" ? "pending" : "not_required"),
    createdAt: user.createdAt || null,
  };
}

// GET /api/admin/dashboard
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const [totalAgents, totalTourists, hotelNames] = await Promise.all([
      User.countDocuments({ role: "Agent" }),
      User.countDocuments({ role: "Tourist" }),
      User.distinct("hotelName", {
        role: "Agent",
        hotelName: { $exists: true, $nin: ["", null] },
      }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalAgents,
        totalTourists,
        totalHotels: hotelNames.length,
        // SOS model abhi confirm nahi hai; false zero count avoid karne ke liye null.
        activeSOSAlerts: null,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not load Admin dashboard.",
    });
  }
});

// GET /api/admin/agents
router.get("/agents", requireAdmin, async (req, res) => {
  try {
    const agents = await User.find({ role: "Agent" })
      .select("name email phone role hotelName hotelAddress agentId verificationStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      agents: agents.map(safeUser),
    });
  } catch (error) {
    console.error("Admin agents error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not load agents.",
    });
  }
});

// GET /api/admin/tourists
router.get("/tourists", requireAdmin, async (req, res) => {
  try {
    const tourists = await User.find({ role: "Tourist" })
      .select("name email phone role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      tourists: tourists.map(safeUser),
    });
  } catch (error) {
    console.error("Admin tourists error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not load tourists.",
    });
  }
});

// Remote-area records need a defined model/schema first.
router.get("/remote-areas", requireAdmin, (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Remote area management is not configured yet.",
  });
});

// SOS records will be connected after checking the existing SOS model/routes.
router.get("/sos-alerts", requireAdmin, (req, res) => {
  return res.status(501).json({
    success: false,
    message: "SOS alert listing is not configured yet.",
  });
});

module.exports = router;
