"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getStatusLabel } from "../../lib/status";
import { t, useLang } from "../../lib/i18n";

function AdminStatCard({ label, value }) {
  return (
    <div className="panel-soft p-4 hover-lift">
      <p className="section-title">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const lang = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");
    setActionError("");
    try {
      const response = await apiFetch("/api/admin/overview");
      setData(response);
    } catch (err) {
      if (err.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (err.status === 403) {
        window.location.href = "/dashboard";
        return;
      }
      setError(err.message || t(lang, "admin_load_error"));
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(user) {
    if (!user?.id) return;
    const ok = window.confirm(`${t(lang, "admin_confirm_delete_user")} ${user.email} ?`);
    if (!ok) return;
    setActionError("");
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      await loadOverview();
    } catch (err) {
      if (err.status === 409) {
        setActionError(t(lang, "admin_delete_forbidden"));
        return;
      }
      setActionError(err.message || t(lang, "admin_delete_user_error"));
    }
  }

  async function deleteTask(task) {
    if (!task?.id) return;
    const ok = window.confirm(`${t(lang, "admin_confirm_delete_task")} "${task.title}" ?`);
    if (!ok) return;
    setActionError("");
    try {
      await apiFetch(`/api/admin/tasks/${task.id}`, { method: "DELETE" });
      await loadOverview();
    } catch (err) {
      setActionError(err.message || t(lang, "admin_delete_task_error"));
    }
  }

  async function toggleSuspend(user) {
    if (!user?.id) return;
    const label = user.suspended ? t(lang, "admin_confirm_reactivate") : t(lang, "admin_confirm_suspend");
    const ok = window.confirm(`${label} ${user.email} ?`);
    if (!ok) return;
    setActionError("");
    try {
      await apiFetch(`/api/admin/users/${user.id}/suspend`, {
        method: "PATCH",
        body: JSON.stringify({ suspended: !user.suspended })
      });
      await loadOverview();
    } catch (err) {
      if (err.status === 409) {
        setActionError(t(lang, "admin_forbidden_action"));
        return;
      }
      setActionError(err.message || t(lang, "admin_suspend_error"));
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    function handleSync() {
      loadOverview();
    }
    window.addEventListener("app:sync", handleSync);
    return () => window.removeEventListener("app:sync", handleSync);
  }, []);

  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="card p-4 sm:p-6 hover-lift">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">{t(lang, "admin_title")}</h2>
            <p className="text-sm text-slate-600">{t(lang, "admin_subtitle")}</p>
          </div>
          <button className="btn-ghost w-full sm:w-auto" onClick={loadOverview}>
            {t(lang, "refresh_label")}
          </button>
        </div>
      </section>

      {loading ? <p className="text-slate-500">{t(lang, "loading")}</p> : null}
      {error ? <p className="text-red-500">{error}</p> : null}
      {actionError ? <p className="text-red-500">{actionError}</p> : null}

      {!loading && data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <AdminStatCard label={t(lang, "users_label")} value={data.overview.totalUsers} />
            <AdminStatCard label={t(lang, "tasks_label")} value={data.overview.totalTasks} />
            <AdminStatCard label={t(lang, "todo_label")} value={data.overview.todoTasks} />
            <AdminStatCard label={t(lang, "in_progress_label")} value={data.overview.inProgressTasks} />
            <AdminStatCard label={t(lang, "done_label")} value={data.overview.doneTasks} />
            <AdminStatCard label={t(lang, "suspended_label")} value={data.overview.suspendedUsers} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="card p-4 sm:p-6 hover-lift">
              <h3 className="text-lg font-semibold">{t(lang, "recent_users_title")}</h3>
              {data.recentUsers.length === 0 ? <p className="mt-4 text-slate-500">{t(lang, "no_recent_users")}</p> : null}
              <ul className="mt-4 space-y-2">
                {data.recentUsers.map((user) => (
                  <li key={user.id} className="panel-soft flex flex-wrap items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{user.email}</p>
                      <p className="text-xs text-slate-500">{new Date(user.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 px-2 py-1 text-xs uppercase tracking-[0.15em]">
                        {user.role}
                      </span>
                      {user.suspended ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs uppercase tracking-[0.15em] text-amber-700">
                          {t(lang, "suspended_badge")}
                        </span>
                      ) : null}
                      <button className="btn-ghost text-xs sm:text-sm" onClick={() => toggleSuspend(user)} disabled={user.role === "admin"}>
                        {user.suspended ? t(lang, "reactivate_label") : t(lang, "suspend_label")}
                      </button>
                      <button
                        className="btn-ghost text-red-600 text-xs sm:text-sm"
                        onClick={() => deleteUser(user)}
                        disabled={user.role === "admin"}
                      >
                        {t(lang, "delete_label")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card p-4 sm:p-6 hover-lift">
              <h3 className="text-lg font-semibold">{t(lang, "recent_tasks_admin_title")}</h3>
              {data.recentTasks.length === 0 ? <p className="mt-4 text-slate-500">{t(lang, "no_recent_tasks")}</p> : null}
              <ul className="mt-4 space-y-2">
                {data.recentTasks.map((task) => (
                  <li key={task.id} className="panel-soft p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.ownerEmail}</p>
                      </div>
                      <button className="btn-ghost text-red-600 text-xs sm:text-sm" onClick={() => deleteTask(task)}>
                        {t(lang, "delete_label")}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{getStatusLabel(task.status, lang)}</span>
                      <span>{new Date(task.createdAt).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
