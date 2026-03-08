import mongoose from "mongoose";

const preferencesSchema = new mongoose.Schema(
  {
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    language: { type: String, enum: ["fr", "en"], default: "fr" },
    notifications: {
      type: String,
      enum: ["none", "email", "push"],
      default: "none"
    },
    density: { type: String, enum: ["comfortable", "compact"], default: "comfortable" },
    timezone: { type: String, default: "auto" }
  },
  { _id: false }
);

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true },
    expirationTime: { type: Number, default: null },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    suspended: { type: Boolean, default: false },
    suspendedAt: { type: Date, default: null },
    avatarUrl: { type: String, default: "" },
    preferences: { type: preferencesSchema, default: () => ({}) },
    pushSubscriptions: { type: [pushSubscriptionSchema], default: [] }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
