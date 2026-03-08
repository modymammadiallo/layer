"use client";

import { useEffect } from "react";
import { apiFetch } from "../lib/api";

function toUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;
    const allowInDev = process.env.NEXT_PUBLIC_ENABLE_SW_DEV === "true";

    if (process.env.NODE_ENV !== "production" && !allowInDev) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }

    let cancelled = false;

    async function syncPushSubscription() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;

        const keyData = await apiFetch("/api/push/public-key");
        const publicKey = keyData?.publicKey || "";
        if (!publicKey) return;

        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          const permission =
            Notification.permission === "granted"
              ? "granted"
              : await Notification.requestPermission();
          if (permission !== "granted") return;
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: toUint8Array(publicKey)
          });
        }

        await apiFetch("/api/user/push-subscription", {
          method: "POST",
          body: JSON.stringify({ subscription })
        });
      } catch {
        // Push not configured or user not authenticated yet.
      }
    }

    syncPushSubscription();
    const interval = window.setInterval(syncPushSubscription, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
