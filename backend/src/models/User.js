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

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatarUrl: { type: String, default: "" },
    preferences: { type: preferencesSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
