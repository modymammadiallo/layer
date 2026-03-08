import express from "express";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";

const router = express.Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const user = await User.findById(req.user.id).select("email role avatarUrl preferences");
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json({
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl || "",
      preferences: user.preferences || {}
    }
  });
});

router.post("/push-subscription", async (req, res) => {
  const subscription = req.body?.subscription;
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return res.status(400).json({ message: "Invalid subscription payload" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }

  const normalized = {
    endpoint,
    expirationTime: subscription.expirationTime || null,
    keys: { p256dh, auth }
  };

  const existingIndex = user.pushSubscriptions.findIndex(
    (sub) => sub.endpoint === endpoint
  );
  if (existingIndex >= 0) {
    user.pushSubscriptions[existingIndex] = normalized;
  } else {
    user.pushSubscriptions.push(normalized);
  }
  await user.save();
  res.status(201).json({ ok: true });
});

router.delete("/push-subscription", async (req, res) => {
  const endpoint = (req.body?.endpoint || "").toString().trim();
  if (!endpoint) {
    return res.status(400).json({ message: "Endpoint required" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }
  user.pushSubscriptions = user.pushSubscriptions.filter(
    (sub) => sub.endpoint !== endpoint
  );
  await user.save();
  res.json({ ok: true });
});

router.get("/directory", async (req, res) => {
  const query = (req.query.q || "").toString().trim().toLowerCase();
  const filter = { _id: { $ne: req.user.id } };
  if (query) {
    filter.email = { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }
  const users = await User.find(filter)
    .select("_id email avatarUrl")
    .sort({ email: 1 })
    .limit(25);
  res.json({
    users: users.map((user) => ({
      id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl || ""
    }))
  });
});

router.put("/profile", async (req, res) => {
  const { email, avatarUrl } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }
  if (email) {
    const emailLower = email.toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower);
    if (!emailOk) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(409).json({ message: "Email already in use" });
    }
    user.email = emailLower;
  }
  if (avatarUrl !== undefined) {
    const urlOk =
      avatarUrl === "" ||
      avatarUrl.startsWith("data:image/") ||
      /^https?:\/\//.test(avatarUrl);
    if (!urlOk) {
      return res.status(400).json({ message: "Invalid avatar url" });
    }
    user.avatarUrl = avatarUrl;
  }
  await user.save();
  res.json({ user: { id: user._id, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
});

router.put("/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Missing password fields" });
  }
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: "Password updated" });
});

router.put("/settings", async (req, res) => {
  const { theme, language, notifications, density, timezone } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }
  const themes = ["light", "dark", "system"];
  const languages = ["fr", "en"];
  const notifs = ["none", "email", "push"];
  const densities = ["comfortable", "compact"];

  if (theme && !themes.includes(theme)) {
    return res.status(400).json({ message: "Invalid theme" });
  }
  if (language && !languages.includes(language)) {
    return res.status(400).json({ message: "Invalid language" });
  }
  if (notifications && !notifs.includes(notifications)) {
    return res.status(400).json({ message: "Invalid notifications" });
  }
  if (density && !densities.includes(density)) {
    return res.status(400).json({ message: "Invalid density" });
  }

  if (theme) user.preferences.theme = theme;
  if (language) user.preferences.language = language;
  if (notifications) user.preferences.notifications = notifications;
  if (density) user.preferences.density = density;
  if (timezone !== undefined) user.preferences.timezone = timezone;
  await user.save();
  res.json({ preferences: user.preferences });
});

router.delete("/", async (req, res) => {
  await Task.deleteMany({ userId: req.user.id });
  await User.findByIdAndDelete(req.user.id);
  res.clearCookie("token");
  res.json({ message: "Account deleted" });
});

export default router;
