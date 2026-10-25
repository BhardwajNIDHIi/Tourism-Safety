const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const {
  sendEmailOtp,
  verifyEmailOtp,
  isEmailVerified,
} = require("../utils/emailOtp");

const router = express.Router();

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables.");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Normalize role for comparison and database lookup.
function normalizeRole(role) {
  if (typeof role !== "string") return null;

  const normalized = role.trim().toLowerCase();

  if (normalized === "tourist") return "Tourist";
  if (normalized === "agent") return "Agent";

  return null;
}

// Return a safe public user object without the password.
function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hotelName: user.hotelName || "",
    hotelAddress: user.hotelAddress || "",
    agentId: user.agentId || "",
    verificationStatus:
      user.verificationStatus ||
      (user.role === "Agent" ? "pending" : "not_required"),
  };
}

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please sign in.",
      });
    }

    await sendEmailOtp(normalizedEmail);

    return res.json({
      success: true,
      message: "OTP sent to your email address.",
    });
  } catch (error) {
    console.error("Send OTP error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 429
          ? error.message
          : "Could not send OTP. Please check the email configuration.",
    });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const result = verifyEmailOtp(email.trim().toLowerCase(), otp);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: "Email verified successfully. You can now sign up.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error.message);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed.",
    });
  }
});

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      hotelName,
      hotelAddress,
      agentId,
      agentVerificationCode,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof password !== "string" ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const normalizedRole = normalizeRole(role);

    if (!normalizedRole) {
      return res.status(400).json({
        success: false,
        message: "Role must be Tourist or Agent.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    if (normalizedRole === "Agent") {
      if (
        typeof hotelName !== "string" ||
        !hotelName.trim() ||
        typeof hotelAddress !== "string" ||
        !hotelAddress.trim() ||
        typeof agentId !== "string" ||
        !agentId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Hotel name, hotel address and Agent ID are required.",
        });
      }

      if (
        !process.env.AGENT_VERIFICATION_CODE ||
        agentVerificationCode !== process.env.AGENT_VERIFICATION_CODE
      ) {
        return res.status(403).json({
          success: false,
          message: "Invalid agent verification code.",
        });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Email OTP verification is compulsory before signup.
    if (!isEmailVerified(normalizedEmail)) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email with OTP before signing up.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: normalizedRole,
      hotelName:
        normalizedRole === "Agent" ? hotelName.trim() : "",
      hotelAddress:
        normalizedRole === "Agent" ? hotelAddress.trim() : "",
      agentId:
        normalizedRole === "Agent" ? agentId.trim() : "",
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

// POST /api/auth/signin
router.post("/signin", async (req, res) => {
  try {
    const { email, password, role } = req.body || {};

    // Validate required sign-in fields.
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password ||
      typeof role !== "string" ||
      !role.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required.",
      });
    }

    const normalizedRole = normalizeRole(role);

    if (!normalizedRole) {
      return res.status(400).json({
        success: false,
        message: "Invalid account role. Select Tourist or Agent.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      role: normalizedRole,
    }).select("+password");

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email, password or role.",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Signin error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});

module.exports = router;
