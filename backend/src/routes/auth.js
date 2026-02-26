import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = express.Router();

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax");
  return {
    httpOnly: true,
    secure: isProd,
    sameSite
  };
}

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role || "user" }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
  res.cookie("token", token, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email: email.toLowerCase(), passwordHash, role: "user" });
  setAuthCookie(res, user);
  return res.status(201).json({ id: user._id, email: user.email, role: user.role });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  setAuthCookie(res, user);
  return res.json({ id: user._id, email: user.email, role: user.role });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", getCookieOptions());
  res.json({ message: "Logged out" });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(200).json({ user: null });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("email role");
    if (!user) {
      return res.status(200).json({ user: null });
    }
    return res.json({ user: { id: user._id, email: user.email, role: user.role } });
  } catch {
    return res.status(200).json({ user: null });
  }
});

export default router;
