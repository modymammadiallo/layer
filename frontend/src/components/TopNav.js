"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { t, useLang } from "../lib/i18n";
import { apiFetch } from "../lib/api";

const BASE_LINKS = [
  { href: "/dashboard", labelKey: "nav_overview" },
  { href: "/tasks", labelKey: "nav_tasks" },
  { href: "/reminders", labelKey: "reminders_nav" },
  { href: "/tasks/new", labelKey: "nav_new" }
];

export default function TopNav({ isAdmin = false }) {
  const pathname = usePathname();
  const lang = useLang();
  const [hasMissedReminders, setHasMissedReminders] = useState(false);

  const links = isAdmin
    ? [...BASE_LINKS, { href: "/admin", labelKey: "nav_admin" }]
    : BASE_LINKS;

  useEffect(() => {
    let cancelled = false;

    async function refreshMissedReminders() {
      try {
        const data = await apiFetch("/api/tasks");
        if (cancelled) return;
        const now = Date.now();
        const missed = (data.tasks || []).some((task) => {
          if (!task?.reminderAt) return false;
          const when = new Date(task.reminderAt).getTime();
          if (Number.isNaN(when)) return false;
          if (task.status === "done") return false;
          return when < now;
        });
        setHasMissedReminders(missed);
      } catch {
        if (!cancelled) {
          setHasMissedReminders(false);
        }
      }
    }

    refreshMissedReminders();
    const interval = window.setInterval(refreshMissedReminders, 60000);
    function handleSync() {
      refreshMissedReminders();
    }
    window.addEventListener("app:sync", handleSync);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("app:sync", handleSync);
    };
  }, [pathname]);

  return (
    <nav className="mx-auto w-full max-w-6xl px-4 pb-5 sm:px-8">
      <div className="card hidden p-3 sm:flex sm:items-center sm:justify-between">
        <div className="-mx-1 hidden gap-2 overflow-x-auto px-1 pb-1 sm:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${active ? "btn-primary" : "btn-ghost"} shrink-0`}
              >
                <span className="relative inline-flex items-center">
                  {t(lang, link.labelKey)}
                  {link.href === "/reminders" && hasMissedReminders ? (
                    <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="hidden sm:flex">
          <Link
            href="/settings"
            className={
              pathname === "/settings"
                ? "btn-primary w-full sm:w-auto"
                : "btn-ghost flex w-full items-center justify-center gap-2 sm:w-auto"
            }
            aria-label="Preferences"
          >
            <span>{t(lang, "nav_settings")}</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4.5 12a7.5 7.5 0 0 1 .1-1.2l-1.95-1.5 2-3.46 2.34.63a7.6 7.6 0 0 1 2.08-1.2l.36-2.4h4.1l.36 2.4a7.6 7.6 0 0 1 2.08 1.2l2.34-.63 2 3.46-1.95 1.5c.07.39.1.79.1 1.2 0 .41-.03.81-.1 1.2l1.95 1.5-2 3.46-2.34-.63a7.6 7.6 0 0 1-2.08 1.2l-.36 2.4h-4.1l-.36-2.4a7.6 7.6 0 0 1-2.08-1.2l-2.34.63-2-3.46 1.95-1.5c-.07-.39-.1-.79-.1-1.2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="sm:hidden fixed bottom-4 left-0 right-0 z-50 px-4">
        <div
          className={`card mobile-bottom-nav relative grid ${isAdmin ? "grid-cols-5" : "grid-cols-4"} items-center gap-1 rounded-3xl p-2 shadow-lg`}
        >
          <Link
            href="/dashboard"
            className={`menu-item flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] ${pathname === "/dashboard" ? "menu-item-active" : ""}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM4 13h7v7H4v-7Zm9 5h7v2h-7v-2Z"
              />
            </svg>
            {t(lang, "nav_overview")}
          </Link>
          <Link
            href="/tasks"
            className={`menu-item flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] ${pathname === "/tasks" ? "menu-item-active" : ""}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 6h14v2H7V6Zm0 5h14v2H7v-2Zm0 5h14v2H7v-2ZM3 5h2v2H3V5Zm0 5h2v2H3v-2Zm0 5h2v2H3v-2Z"
              />
            </svg>
            {t(lang, "nav_tasks")}
          </Link>
          <Link
            href="/reminders"
            className={`menu-item flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] ${pathname === "/reminders" ? "menu-item-active" : ""}`}
          >
            <span className="relative inline-flex">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                />
              </svg>
              {hasMissedReminders ? (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
              ) : null}
            </span>
            {t(lang, "reminders_nav")}
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className={`menu-item flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] ${pathname === "/admin" ? "menu-item-active" : ""}`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Z"
                />
              </svg>
              {t(lang, "nav_admin")}
            </Link>
          ) : null}
          <Link
            href="/settings"
            className={`menu-item flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] ${pathname === "/settings" ? "menu-item-active" : ""}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
              />
              <path
                fill="currentColor"
                d="M4.5 12a7.5 7.5 0 0 1 .1-1.2l-1.95-1.5 2-3.46 2.34.63a7.6 7.6 0 0 1 2.08-1.2l.36-2.4h4.1l.36 2.4a7.6 7.6 0 0 1 2.08 1.2l2.34-.63 2 3.46-1.95 1.5c.07.39.1.79.1 1.2 0 .41-.03.81-.1 1.2l1.95 1.5-2 3.46-2.34-.63a7.6 7.6 0 0 1-2.08 1.2l-.36 2.4h-4.1l-.36-2.4a7.6 7.6 0 0 1-2.08-1.2l-2.34.63-2-3.46 1.95-1.5c-.07-.39-.1-.79-.1-1.2Z"
              />
            </svg>
            {t(lang, "nav_settings")}
          </Link>
          <Link
            href="/tasks/new"
            className={`mobile-fab menu-item flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] ${pathname === "/tasks/new" ? "menu-item-active" : ""}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"
              />
            </svg>
            {t(lang, "nav_new")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
