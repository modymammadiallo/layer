"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { getStatusLabel } from "../../lib/status";
import { t, useLang } from "../../lib/i18n";

export default function DashboardPage() {
  const lang = useLang();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "done").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const todo = tasks.filter((task) => task.status === "todo").length;
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, inProgress, todo, completionRate };
  }, [tasks]);

  const recentTasks = useMemo(() => tasks.slice(0, 5), [tasks]);

  async function loadTasks() {
    setLoading(true);
    try {
      const data = await apiFetch("/api/tasks");
      setTasks(data.tasks || []);
    } catch (err) {
      if (err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err.message || t(lang, "tasks_load_error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    function handleSync() {
      loadTasks();
    }
    window.addEventListener("app:sync", handleSync);
    return () => window.removeEventListener("app:sync", handleSync);
  }, []);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8">
      <section className="card p-4 sm:p-6 hover-lift">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">{t(lang, "dashboard_title")}</h2>
            <p className="text-sm text-slate-600">
              {stats.total} {t(lang, "dashboard_summary_prefix")} {stats.inProgress} {t(lang, "dashboard_summary_middle")} {stats.done} {t(lang, "dashboard_summary_suffix")}
            </p>
          </div>
          <button className="btn-ghost w-full sm:w-auto" onClick={logout}>
            {t(lang, "logout")}
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
            <span>{t(lang, "completion_rate")}</span>
            <span>{stats.completionRate}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel-soft p-4 hover-lift">
            <p className="section-title">{t(lang, "total_label")}</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="panel-soft p-4 hover-lift">
            <p className="section-title">{t(lang, "todo_label")}</p>
            <p className="mt-2 text-2xl font-semibold">{stats.todo}</p>
          </div>
          <div className="panel-soft p-4 hover-lift">
            <p className="section-title">{t(lang, "in_progress_label")}</p>
            <p className="mt-2 text-2xl font-semibold">{stats.inProgress}</p>
          </div>
          <div className="panel-soft p-4 hover-lift">
            <p className="section-title">{t(lang, "done_label")}</p>
            <p className="mt-2 text-2xl font-semibold">{stats.done}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <article className="card p-4 sm:p-6 hover-lift">
          <h3 className="text-lg font-semibold">{t(lang, "quick_actions_title")}</h3>
          <p className="mt-2 text-sm text-slate-600">{t(lang, "quick_actions_subtitle")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link className="btn-primary text-center" href="/tasks/new">
              {t(lang, "create_task")}
            </Link>
            <Link className="btn-ghost text-center" href="/tasks">
              {t(lang, "open_list")}
            </Link>
            <Link className="btn-ghost text-center" href="/settings">
              {t(lang, "settings_label")}
            </Link>
            <button className="btn-ghost" onClick={loadTasks}>
              {t(lang, "sync_label")}
            </button>
          </div>
        </article>

        <article className="card p-4 sm:p-6 hover-lift">
          <h3 className="text-lg font-semibold">{t(lang, "recent_tasks_title")}</h3>
          {loading ? <p className="mt-3 text-slate-500">{t(lang, "loading")}</p> : null}
          {error ? <p className="mt-3 text-red-500">{error}</p> : null}
          {!loading && !error && recentTasks.length === 0 ? (
            <p className="mt-3 text-slate-500">{t(lang, "no_tasks_yet")}</p>
          ) : null}
          <ul className="mt-3 space-y-2">
            {recentTasks.map((task) => (
              <li key={task._id} className="panel-soft flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-slate-500">{getStatusLabel(task.status, lang)}</p>
                </div>
                <Link className="btn-ghost text-xs sm:text-sm" href={`/task/${task._id}`}>
                  {t(lang, "open_label")}
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

