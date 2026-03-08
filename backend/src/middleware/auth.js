import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("role suspended");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.suspended) {
      return res.status(403).json({ message: "Account suspended" });
    }
    req.user = { id: user._id.toString(), role: user.role || "user" };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
