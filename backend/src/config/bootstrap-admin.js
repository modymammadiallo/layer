import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export async function ensureAdminAccount() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const forceReset = process.env.ADMIN_FORCE_RESET === "true";

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existing = await User.findOne({ email: adminEmail });

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({
      email: adminEmail,
      passwordHash,
      role: "admin",
      preferences: {
        theme: "system",
        language: "fr",
        notifications: "none",
        density: "comfortable",
        timezone: "auto"
      }
    });
    console.log(`[admin] Admin account created: ${adminEmail}`);
    return;
  }

  let changed = false;
  if (existing.role !== "admin") {
    existing.role = "admin";
    changed = true;
  }

  if (forceReset) {
    existing.passwordHash = await bcrypt.hash(adminPassword, 12);
    changed = true;
  }

  if (changed) {
    await existing.save();
    console.log(`[admin] Admin account updated: ${adminEmail}`);
  }
}
