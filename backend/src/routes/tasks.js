import express from "express";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
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

function accessFilter(userId) {
  return {
    $or: [{ userId }, { "collaborators.userId": userId }]
  };
}

async function findTaskForAccess(taskId, userId) {
  return Task.findOne({ _id: taskId, ...accessFilter(userId) });
}

function isOwner(task, userId) {
  return task.userId.toString() === userId.toString();
}

function getCollaborator(task, userId) {
  return (task.collaborators || []).find(
    (collab) => collab.userId.toString() === userId.toString()
  );
}

function collaboratorStatus(collaborator) {
  if (!collaborator) return null;
  return collaborator.status || "accepted";
}

function canManageSubtasks(task, userId) {
  if (isOwner(task, userId)) return true;
  const collab = getCollaborator(task, userId);
  return Boolean(collab && collaboratorStatus(collab) === "accepted");
}

function serializeTaskForUser(task, userId) {
  const owner = isOwner(task, userId);
  const collaborator = getCollaborator(task, userId);
  const invitationStatus = collaboratorStatus(collaborator);
  const data = task.toObject();
  return {
    ...data,
    currentUserId: userId.toString(),
    collaborators: owner ? data.collaborators : [],
    isOwner: owner,
    canEditTask: owner,
    canDeleteTask: owner,
    canManageCollaborators: owner,
    canManageSubtasks: canManageSubtasks(task, userId),
    canRespondInvite: !owner && invitationStatus === "pending",
    invitationStatus
  };
}

router.get("/", async (req, res) => {
  const tasks = await Task.find(accessFilter(req.user.id)).sort({ createdAt: -1 });
  res.json({ tasks: tasks.map((task) => serializeTaskForUser(task, req.user.id)) });
});

router.post("/", async (req, res) => {
  const { title, description, reminderAt } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Title required" });
  }
  const task = await Task.create({
    userId: req.user.id,
    title,
    description: description || "",
    status: "todo",
    reminderAt: reminderAt ? new Date(reminderAt) : null,
    reminderNotifiedAt: null
  });
  res.status(201).json({ task });
});

router.get("/:id", async (req, res) => {
  const task = await findTaskForAccess(req.params.id, req.user.id);
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json({ task: serializeTaskForUser(task, req.user.id) });
});

router.put("/:id", async (req, res) => {
  const { title, description, status, subtasks, reminderAt } = req.body;
  const task = await findTaskForAccess(req.params.id, req.user.id);
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  if (!isOwner(task, req.user.id)) {
    return res.status(403).json({ message: "Only owner can modify task details" });
  }
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (reminderAt !== undefined) {
    task.reminderAt = reminderAt ? new Date(reminderAt) : null;
    task.reminderNotifiedAt = null;
  }
  if (Array.isArray(subtasks)) task.subtasks = subtasks;
  recomputeStatus(task);
  await task.save();
  res.json({ task: serializeTaskForUser(task, req.user.id) });
});

router.delete("/:id", async (req, res) => {
  const task = await findTaskForAccess(req.params.id, req.user.id);
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  if (!isOwner(task, req.user.id)) {
    return res.status(403).json({ message: "Only owner can delete task" });
  }
  await task.deleteOne();
  res.json({ message: "Deleted" });
});

router.post("/:id/subtasks", async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Title required" });
  }
  const task = await findTaskForAccess(req.params.id, req.user.id);
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  if (!canManageSubtasks(task, req.user.id)) {
    return res.status(403).json({ message: "Accept invitation before editing subtasks" });
  }
  task.subtasks.push({ title, completed: false });
  recomputeStatus(task);
  await task.save();
  res.status(201).json({ task: serializeTaskForUser(task, req.user.id) });
});

router.put("/:id/subtasks/:subtaskId", async (req, res) => {
  const { title, completed } = req.body;
  const task = await findTaskForAccess(req.params.id, req.user.id);
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  if (!canManageSubtasks(task, req.user.id)) {
    return res.status(403).json({ message: "Accept invitation before editing subtasks" });
  }
  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) {
    return res.status(404).json({ message: "Subtask not found" });
  }
  if (title !== undefined) subtask.title = title;
  if (completed !== undefined) subtask.completed = completed;
  recomputeStatus(task);
  await task.save();
  res.json({ task: serializeTaskForUser(task, req.user.id) });
});

router.delete("/:id/subtasks/:subtaskId", async (req, res) => {
  const task = await findTaskForAccess(req.params.id, req.user.id);
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }
  if (!canManageSubtasks(task, req.user.id)) {
    return res.status(403).json({ message: "Accept invitation before editing subtasks" });
  }
  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) {
    return res.status(404).json({ message: "Subtask not found" });
  }
  subtask.deleteOne();
  recomputeStatus(task);
  await task.save();
  res.json({ task: serializeTaskForUser(task, req.user.id) });
});

router.post("/:id/collaborators", async (req, res) => {
  const rawEmail = (req.body?.email || "").toString().trim().toLowerCase();
  if (!rawEmail) {
    return res.status(400).json({ message: "Email required" });
  }

  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }

  const user = await User.findOne({ email: rawEmail }).select("_id email");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user._id.toString() === req.user.id.toString()) {
    return res.status(400).json({ message: "You are already owner" });
  }
  const exists = task.collaborators.some(
    (collab) => collab.userId.toString() === user._id.toString()
  );
  if (exists) {
    return res.status(409).json({ message: "Already collaborator" });
  }

  task.collaborators.push({
    userId: user._id,
    email: user.email,
    status: "pending",
    invitedAt: new Date(),
    respondedAt: null
  });
  await task.save();
  res.status(201).json({ task: serializeTaskForUser(task, req.user.id) });
});

router.post("/:id/collaborators/:collaboratorId/respond", async (req, res) => {
  const action = (req.body?.action || "").toString().trim().toLowerCase();
  if (!["accept", "reject"].includes(action)) {
    return res.status(400).json({ message: "Action must be accept or reject" });
  }

  const task = await findTaskForAccess(req.params.id, req.user.id);
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }

  const collaboratorId = req.params.collaboratorId.toString();
  if (collaboratorId !== req.user.id.toString()) {
    return res.status(403).json({ message: "You can only respond for yourself" });
  }

  const collaborator = getCollaborator(task, req.user.id);
  if (!collaborator) {
    return res.status(404).json({ message: "Invitation not found" });
  }
  if (collaborator.status !== "pending") {
    return res.status(409).json({ message: "Invitation already processed" });
  }

  if (action === "accept") {
    collaborator.status = "accepted";
    collaborator.respondedAt = new Date();
  } else {
    task.collaborators = task.collaborators.filter(
      (collab) => collab.userId.toString() !== req.user.id.toString()
    );
  }

  await task.save();
  res.json({ task: serializeTaskForUser(task, req.user.id) });
});

router.delete("/:id/collaborators/:collaboratorId", async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }

  const before = task.collaborators.length;
  task.collaborators = task.collaborators.filter(
    (collab) => collab.userId.toString() !== req.params.collaboratorId
  );
  if (before === task.collaborators.length) {
    return res.status(404).json({ message: "Collaborator not found" });
  }
  await task.save();
  res.json({ task: serializeTaskForUser(task, req.user.id) });
});

export default router;
