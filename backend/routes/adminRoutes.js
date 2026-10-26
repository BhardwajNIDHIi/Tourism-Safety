
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SOSAlert = require("../models/SOSAlert");

const router = express.Router();

// ==================== ADMIN AUTHENTICATION ====================

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

// ==================== USER FORMATTER ====================

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

// ==================== DASHBOARD ====================

// GET /api/admin/dashboard
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const [
      totalAgents,
      totalTourists,
      hotelNames,
      activeSOSAlerts,
      totalSOSAlerts,
    ] = await Promise.all([
      User.countDocuments({ role: "Agent" }),
      User.countDocuments({ role: "Tourist" }),
      User.distinct("hotelName", {
        role: "Agent",
        hotelName: { $exists: true, $nin: ["", null] },
      }),
      SOSAlert.countDocuments({ status: "Active" }),
      SOSAlert.countDocuments({}),
    ]);

    return res.json({
      success: true,
      stats: {
        totalAgents,
        totalTourists,
        totalHotels: hotelNames.length,
        activeSOSAlerts,
        totalSOSAlerts,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load Admin dashboard.",
    });
  }
});

// ==================== AGENTS ====================

// GET /api/admin/agents
router.get("/agents", requireAdmin, async (req, res) => {
  try {
    const agents = await User.find({ role: "Agent" })
      .select(
        "name email phone role hotelName hotelAddress agentId verificationStatus createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      total: agents.length,
      agents: agents.map(safeUser),
    });
  } catch (error) {
    console.error("Admin agents error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load agents.",
    });
  }
});

// ==================== TOURISTS ====================

// GET /api/admin/tourists
router.get("/tourists", requireAdmin, async (req, res) => {
  try {
    const tourists = await User.find({ role: "Tourist" })
      .select("name email phone role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      total: tourists.length,
      tourists: tourists.map(safeUser),
    });
  } catch (error) {
    console.error("Admin tourists error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load tourists.",
    });
  }
});

// ==================== SOS ALERTS ====================

// GET /api/admin/sos-alerts
router.get("/sos-alerts", requireAdmin, async (req, res) => {
  try {
    const alerts = await SOSAlert.find({})
      .populate("user", "name phone email role")
      .sort({ createdAt: -1 })
      .lean();

    const formattedAlerts = alerts.map((alert) => ({
      id: alert._id.toString(),
      touristId: alert.user?._id?.toString() || "",
      touristName: alert.user?.name || "Unknown Tourist",
      touristPhone: alert.user?.phone || "",
      touristEmail: alert.user?.email || "",
      category: alert.category || "Other",
      description: alert.description || "",
      location: alert.location || {
        latitude: null,
        longitude: null,
      },
      forWhom: alert.forWhom || "Me",
      status: alert.status || "Active",
      createdAt: alert.createdAt || null,
      updatedAt: alert.updatedAt || null,
    }));

    const activeCount = formattedAlerts.filter(
      (alert) => alert.status === "Active"
    ).length;

    const acknowledgedCount = formattedAlerts.filter(
      (alert) => alert.status === "Acknowledged"
    ).length;

    const resolvedCount = formattedAlerts.filter(
      (alert) => alert.status === "Resolved"
    ).length;

    return res.json({
      success: true,
      total: formattedAlerts.length,
      activeCount,
      acknowledgedCount,
      resolvedCount,
      alerts: formattedAlerts,
    });
  } catch (error) {
    console.error("Admin SOS alerts error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load SOS alerts.",
    });
  }
});

// ==================== REMOTE AREAS ====================

// Placeholder until a RemoteArea model/schema is implemented.
router.get("/remote-areas", requireAdmin, (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Remote area management is not configured yet.",
  });
});

module.exports = router;
