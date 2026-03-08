"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import InstallPrompt from "./InstallPrompt";
import TopNav from "./TopNav";
import { apiFetch } from "../lib/api";
import { isPublicPath } from "../lib/route-access";
import { t, useLang } from "../lib/i18n";

function SessionLoader({ text }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 sm:px-8">
      <div className="card w-full max-w-md p-8 text-center fade-up">
        <p className="section-title">Layer</p>
        <h2 className="mt-3 text-xl font-semibold">{text.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{text.body}</p>
      </div>
    </div>
  );
}

function OfflineScreen({ lang }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 sm:px-8">
      <div className="card w-full max-w-md p-8 text-center fade-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path
              fill="currentColor"
              className="text-amber-500"
              d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
            />
          </svg>
        </div>
        <p className="section-title">Layer</p>
        <h2 className="mt-3 text-xl font-semibold">{t(lang, "offline_title")}</h2>
        <p className="mt-2 text-sm text-slate-600">{t(lang, "offline_body")}</p>
        <p className="mt-3 text-xs text-slate-400">{t(lang, "offline_hint")}</p>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLang();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const isPublic = useMemo(() => isPublicPath(pathname), [pathname]);
  const mainClass = isPublic
    ? "mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8"
    : "mx-auto w-full max-w-6xl px-4 pb-32 sm:px-8 sm:pb-16 fade-up-delay";

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      if (!online) {
        if (!cancelled) setReady(true);
        return;
      }

      if (isPublic) {
        if (!cancelled) {
          setSessionUser(null);
          setAuthenticated(false);
          setReady(true);
        }
        return;
      }

      try {
        const data = await apiFetch("/api/auth/me");
        if (!cancelled) {
          const loggedIn = Boolean(data?.user);
          const user = data?.user || null;
          setSessionUser(user);
          setAuthenticated(loggedIn);
          setReady(true);

          if (!loggedIn) {
            const next = encodeURIComponent(pathname || "/dashboard");
            router.replace(`/login?next=${next}`);
            return;
          }

          if (pathname?.startsWith("/admin") && user?.role !== "admin") {
            router.replace("/dashboard");
          }
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null);
          setAuthenticated(false);
          setReady(true);
          const next = encodeURIComponent(pathname || "/dashboard");
          router.replace(`/login?next=${next}`);
        }
      }
    }

    setReady(false);
    checkAuth();
    return () => { cancelled = true; };
  }, [isPublic, pathname, online, router]);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      window.location.reload();
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    if (!("Notification" in window)) return;

    const isMobile =
      window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    const isStandalone =
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
    if (!isMobile || !isStandalone) return;

    let cancelled = false;

    async function checkDueReminders() {
      try {
        const data = await apiFetch("/api/tasks");
        if (cancelled) return;
        const now = Date.now();
        const due = (data.tasks || []).filter((task) => {
          if (!task?.reminderAt) return false;
          if (task.status === "done") return false;
          const when = new Date(task.reminderAt).getTime();
          if (Number.isNaN(when)) return false;
          return when <= now;
        });
        if (due.length === 0) return;

        const permission =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker?.ready;
        if (!registration) return;

        for (const task of due) {
          const key = `reminder-notified:${task._id}:${task.reminderAt}`;
          if (localStorage.getItem(key)) continue;
          await registration.showNotification(task.title, {
            body: task.description || "",
            icon: "/icons/icon-192.png",
            tag: `task-reminder-${task._id}`,
            data: { url: `/task/${task._id}` }
          });
          localStorage.setItem(key, "1");
        }
      } catch {
        // Ignore transient fetch/auth errors.
      }
    }

    checkDueReminders();
    const interval = window.setInterval(checkDueReminders, 60000);
    function handleSync() {
      checkDueReminders();
    }
    window.addEventListener("app:sync", handleSync);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("app:sync", handleSync);
    };
  }, [online]);

  // ── Écran de chargement ──────────────────────────────────────────────────
  if (!ready) {
    return <SessionLoader text={{ title: t(lang, "session_title"), body: t(lang, "session_checking") }} />;
  }

  // ── Écran hors ligne ─────────────────────────────────────────────────────
  if (!online) {
    return <OfflineScreen lang={lang} />;
  }

  // ── Redirection si non authentifié ───────────────────────────────────────
  if (!isPublic && !authenticated) {
    return <SessionLoader text={{ title: t(lang, "session_title"), body: t(lang, "session_redirect") }} />;
  }

  if (pathname?.startsWith("/admin") && sessionUser?.role !== "admin") {
    return <SessionLoader text={{ title: t(lang, "session_title"), body: t(lang, "admin_check") }} />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between fade-up">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={sessionUser ? "/dashboard" : "/login"}
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200/70 bg-white sm:h-20 sm:w-20 hover-lift"
            aria-label="Aller au tableau de bord"
          >
            <img src="/icons/icon-192.png" alt="Layer logo" className="h-11 w-11 sm:h-14 sm:w-14" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Layer</p>
              {sessionUser?.role === "admin" ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Admin
                </span>
              ) : null}
            </div>
            <h1 className="text-xl font-semibold text-ink sm:text-2xl lg:text-3xl">
              {t(lang, "app_tagline")}
            </h1>
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
          <InstallPrompt />
          {sessionUser ? (
            <Link
              href="/profile"
              className="h-11 w-11 overflow-hidden rounded-2xl border border-slate-200/70 bg-white"
              aria-label={t(lang, "nav_profile")}
            >
              {sessionUser?.avatarUrl ? (
                <img src={sessionUser.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-500">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm-7 8.5c0-3.59 3.582-6.5 7-6.5s7 2.91 7 6.5"
                    />
                  </svg>
                </div>
              )}
            </Link>
          ) : null}
        </div>
      </header>

      {!isPublic ? <TopNav isAdmin={sessionUser?.role === "admin"} /> : null}

      <main className={mainClass}>{children}</main>
    </div>
  );
}
