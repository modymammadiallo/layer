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
  const [totalUsers, totalTasks, todoTasks, inProgressTasks, doneTasks, recentUsers, recentTasks] = await Promise.all([
    User.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ status: "todo" }),
    Task.countDocuments({ status: "in_progress" }),
    Task.countDocuments({ status: "done" }),
    User.find().sort({ createdAt: -1 }).limit(8).select("email role createdAt"),
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
      doneTasks
    },
    recentUsers: recentUsers.map((user) => ({
      id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
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

export default router;
