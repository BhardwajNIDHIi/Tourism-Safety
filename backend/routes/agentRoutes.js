
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const SOSAlert = require("../models/SOSAlert");

const router = express.Router();

// Verify login token and Agent role
function authenticateAgent(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Please sign in as an Agent.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || decoded.role !== "Agent") {
      return res.status(403).json({
        success: false,
        message: "Agent access only.",
      });
    }

    req.agent = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please sign in again.",
    });
  }
}

// GET /api/agent/sos-alerts
// All Agents can see all Tourist SOS alerts.
router.get("/sos-alerts", authenticateAgent, async (req, res) => {
  try {
    const alerts = await SOSAlert.find()
      .populate("user", "name phone email role")
      .sort({ createdAt: -1 })
      .lean();

    const formattedAlerts = alerts.map((alert) => ({
      id: alert._id.toString(),
      touristName: alert.user?.name || "Unknown Tourist",
      touristPhone: alert.user?.phone || "",
      touristEmail: alert.user?.email || "",
      category: alert.category,
      type: alert.category,
      description: alert.description || "",
      message: alert.description || alert.category,
      location: alert.location || null,
      forWhom: alert.forWhom || "Me",
      status: alert.status || "Active",
      createdAt: alert.createdAt,
    }));

    return res.json({
      success: true,
      total: formattedAlerts.length,
      alerts: formattedAlerts,
    });
  } catch (error) {
    console.error("Agent SOS alerts error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load SOS alerts.",
    });
  }
});

// PATCH /api/agent/sos-alerts/:id/status
// Update SOS status in MongoDB.
router.patch(
  "/sos-alerts/:id/status",
  authenticateAgent,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid SOS alert ID.",
        });
      }

      const statusMap = {
        acknowledged: "Acknowledged",
        resolved: "Resolved",
      };

      const newStatus = statusMap[status];

      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message: "Status must be acknowledged or resolved.",
        });
      }

      const alert = await SOSAlert.findByIdAndUpdate(
        id,
        { $set: { status: newStatus } },
        { new: true, runValidators: true }
      ).populate("user", "name phone email role");

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: "SOS alert not found.",
        });
      }

      return res.json({
        success: true,
        message: `SOS alert marked as ${newStatus}.`,
        alert: {
          id: alert._id.toString(),
          touristName: alert.user?.name || "Unknown Tourist",
          touristPhone: alert.user?.phone || "",
          category: alert.category,
          description: alert.description || "",
          location: alert.location || null,
          forWhom: alert.forWhom || "Me",
          status: alert.status,
          createdAt: alert.createdAt,
        },
      });
    } catch (error) {
      console.error("Update SOS status error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not update SOS status.",
      });
    }
  }
);

module.exports = router;
