import webpush from "web-push";
import { User } from "../models/User.js";

const hasVapid =
  Boolean(process.env.VAPID_PUBLIC_KEY) &&
  Boolean(process.env.VAPID_PRIVATE_KEY) &&
  Boolean(process.env.VAPID_SUBJECT);

if (hasVapid) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export function isPushConfigured() {
  return hasVapid;
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export async function sendPush(subscription, payload) {
  if (!hasVapid) return;
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}

export async function removeSubscriptionByEndpoint(endpoint) {
  if (!endpoint) return;
  await User.updateMany(
    { "pushSubscriptions.endpoint": endpoint },
    { $pull: { pushSubscriptions: { endpoint } } }
  );
}
