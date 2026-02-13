import express from "express";
import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function recomputeStatus(task) {
  if (task.subtasks.length === 0) {
    return;
  }
  const allDone = task.subtasks.every((sub) => sub.completed);
  if (allDone) {
    task.status = "done";
  } else if (task.status === "done") {
    task.status = "in_progress";
  }
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ tasks });
});

router.post("/", async (req, res) => {
  const { title, description, status } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Title required" });
  }
  const task = await Task.create({
    userId: req.user.id,
    title,
    description: description || "",
    status: status || "todo"
  });
  res.status(201).json({ task });
});

router.get("/:id", async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json({ task });
});

router.put("/:id", async (req, res) => {
  const { title, description, status, subtasks } = req.body;
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (Array.isArray(subtasks)) task.subtasks = subtasks;
  recomputeStatus(task);
  await task.save();
  res.json({ task });
});

router.delete("/:id", async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json({ message: "Deleted" });
});

router.post("/:id/subtasks", async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Title required" });
  }
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  task.subtasks.push({ title, completed: false });
  recomputeStatus(task);
  await task.save();
  res.status(201).json({ task });
});

router.put("/:id/subtasks/:subtaskId", async (req, res) => {
  const { title, completed } = req.body;
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) {
    return res.status(404).json({ message: "Subtask not found" });
  }
  if (title !== undefined) subtask.title = title;
  if (completed !== undefined) subtask.completed = completed;
  recomputeStatus(task);
  await task.save();
  res.json({ task });
});

router.delete("/:id/subtasks/:subtaskId", async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) {
    return res.status(404).json({ message: "Subtask not found" });
  }
  subtask.remove();
  recomputeStatus(task);
  await task.save();
  res.json({ task });
});

export default router;
