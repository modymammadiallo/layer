import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import {
  isPushConfigured,
  sendPush,
  removeSubscriptionByEndpoint
} from "./web-push.js";

const POLL_MS = 30 * 1000;
let intervalHandle = null;

function getRecipients(task) {
  const acceptedCollaborators = (task.collaborators || []).filter(
    (c) => !c.status || c.status === "accepted"
  );
  const ids = [
    task.userId?.toString(),
    ...acceptedCollaborators.map((c) => c.userId?.toString())
  ];
  return [...new Set(ids.filter(Boolean))];
}

async function processDueReminders() {
  if (!isPushConfigured()) return;

  const now = new Date();
  const dueTasks = await Task.find({
    reminderAt: { $ne: null, $lte: now },
    status: { $ne: "done" },
    reminderNotifiedAt: null
  }).select("_id userId collaborators title description reminderAt");

  for (const task of dueTasks) {
    const recipientIds = getRecipients(task);
    if (recipientIds.length === 0) {
      task.reminderNotifiedAt = new Date();
      await task.save();
      continue;
    }

    const users = await User.find({ _id: { $in: recipientIds } }).select(
      "pushSubscriptions"
    );

    let attempted = false;
    for (const user of users) {
      for (const subscription of user.pushSubscriptions || []) {
        attempted = true;
        try {
          await sendPush(subscription, {
            title: task.title,
            body: task.description || "",
            taskId: task._id.toString(),
            url: `/task/${task._id.toString()}`,
            tag: `task-reminder-${task._id.toString()}`
          });
        } catch (err) {
          const statusCode = err?.statusCode || 0;
          if (statusCode === 404 || statusCode === 410) {
            await removeSubscriptionByEndpoint(subscription.endpoint);
          }
        }
      }
    }

    if (attempted) {
      task.reminderNotifiedAt = new Date();
      await task.save();
    }
  }
}

export function startReminderWorker() {
  if (intervalHandle || !isPushConfigured()) return;
  processDueReminders().catch(() => {});
  intervalHandle = setInterval(() => {
    processDueReminders().catch(() => {});
  }, POLL_MS);
}
