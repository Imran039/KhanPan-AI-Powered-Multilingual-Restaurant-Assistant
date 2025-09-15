const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("./user.model");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Configure nodemailer (use your Gmail or SMTP credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // set in .env
    pass: process.env.EMAIL_PASS, // set in .env
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Signup (step 1: request)
router.post("/signup", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: "Name and email required." });
    let user = await User.findOne({ email });
    if (user && user.isVerified)
      return res.status(400).json({ message: "Email already registered." });
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    if (!user) {
      user = await User.create({
        name,
        email,
        isVerified: false,
        otp,
        otpExpires,
      });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }
    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "KhanPan Signup OTP",
      text: `Your OTP for KhanPan signup is: ${otp}`,
    });
    res.json({ message: "OTP sent to email." });
  } catch (err) {
    res.status(500).json({ message: "Signup error", error: err.message });
  }
});

// Verify OTP (step 2: set password)
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found." });
    if (user.isVerified) return res.json({ message: "Already verified." });
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    if (!password)
      return res.status(400).json({ message: "Password required." });
    user.password = await bcrypt.hash(password, 10);
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    // Send welcome email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to KhanPan",
      text: `Welcome, ${user.name}! Your account is now verified.`,
    });
    res.json({ message: "Email verified. You can now log in." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "OTP verification error", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isVerified)
      return res
        .status(400)
        .json({ message: "Invalid credentials or not verified." });
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials." });
    // Create JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

// Forgot password (same as before)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found." });
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "KhanPan Password Reset OTP",
      text: `Your OTP for KhanPan password reset is: ${otp}`,
    });
    res.json({ message: "OTP sent to email." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Forgot password error", error: err.message });
  }
});

// Verify OTP (reset)
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found." });
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    res.json({ message: "OTP verified. You can now reset your password." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "OTP verification error", error: err.message });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found." });
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Password reset error", error: err.message });
  }
});

// Validate JWT token
router.get("/validate", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res
      .status(500)
      .json({ message: "Token validation error", error: err.message });
  }
});

module.exports = router;
