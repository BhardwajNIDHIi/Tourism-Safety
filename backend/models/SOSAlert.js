
const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Vehicle Issue",
        "Sickness/Injury",
        "Crime",
        "Lost/Trapped",
        "Fire",
        "Other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    forWhom: {
      type: String,
      enum: ["Me", "Someone else", "Multiple people"],
      default: "Me",
    },

    status: {
      type: String,
      enum: ["Active", "Acknowledged", "Resolved", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
