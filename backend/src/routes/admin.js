import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";

const router = express.Router();

router.use(requireAuth);

router.use(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("role");
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  return next();
});

router.get("/overview", async (req, res) => {
  const [
    totalUsers,
    totalTasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    suspendedUsers,
    recentUsers,
    recentTasks
  ] = await Promise.all([
    User.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ status: "todo" }),
    Task.countDocuments({ status: "in_progress" }),
    Task.countDocuments({ status: "done" }),
    User.countDocuments({ suspended: true }),
    User.find().sort({ createdAt: -1 }).limit(8).select("email role createdAt suspended"),
    Task.find().sort({ createdAt: -1 }).limit(8).select("title status createdAt userId")
  ]);

  const userIds = recentTasks.map((item) => item.userId);
  const owners = await User.find({ _id: { $in: userIds } }).select("email");
  const ownerMap = new Map(owners.map((user) => [String(user._id), user.email]));

  res.json({
    overview: {
      totalUsers,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      suspendedUsers
    },
    recentUsers: recentUsers.map((user) => ({
      id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      suspended: Boolean(user.suspended)
    })),
    recentTasks: recentTasks.map((task) => ({
      id: task._id,
      title: task.title,
      status: task.status,
      createdAt: task.createdAt,
      ownerEmail: ownerMap.get(String(task.userId)) || "unknown"
    }))
  });
});

router.delete("/users/:id", async (req, res) => {
  const targetId = req.params.id;
  if (targetId === String(req.user.id)) {
    return res.status(409).json({ message: "Cannot delete own account" });
  }
  const user = await User.findById(targetId).select("role");
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }
  if (user.role === "admin") {
    return res.status(409).json({ message: "Cannot delete admin" });
  }
  await Task.deleteMany({ userId: user._id });
  await user.deleteOne();
  res.json({ message: "Deleted" });
});

router.patch("/users/:id/suspend", async (req, res) => {
  const targetId = req.params.id;
  if (targetId === String(req.user.id)) {
    return res.status(409).json({ message: "Cannot suspend own account" });
  }
  const user = await User.findById(targetId).select("role suspended");
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }
  if (user.role === "admin") {
    return res.status(409).json({ message: "Cannot suspend admin" });
  }
  const suspend = Boolean(req.body?.suspended);
  user.suspended = suspend;
  user.suspendedAt = suspend ? new Date() : null;
  await user.save();
  res.json({ id: user._id, suspended: user.suspended });
});

router.delete("/tasks/:id", async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json({ message: "Deleted" });
});

export default router;
