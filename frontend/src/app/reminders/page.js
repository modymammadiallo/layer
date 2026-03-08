"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { t, useLang } from "../../lib/i18n";

export default function RemindersPage() {
  const router = useRouter();
  const lang = useLang();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReminders() {
    setLoading(true);
    setError("");
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
    loadReminders();
  }, []);

  useEffect(() => {
    function handleSync() {
      loadReminders();
    }
    window.addEventListener("app:sync", handleSync);
    return () => window.removeEventListener("app:sync", handleSync);
  }, []);

  const reminders = useMemo(() => {
    return tasks
      .filter((task) => task.reminderAt)
      .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt));
  }, [tasks]);

  async function clearReminder(taskId) {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ reminderAt: null })
    });
    loadReminders();
  }

  async function openReminder(taskId) {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ reminderAt: null })
      });
    } catch {
      // Collaborators may not have permission to clear the reminder.
    }
    router.push(`/task/${taskId}`);
  }

  return (
    <div className="space-y-6">
      <section className="card p-4 sm:p-6 hover-lift">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">{t(lang, "reminders_title")}</h2>
          <p className="mt-2 text-sm text-slate-600">{t(lang, "reminders_subtitle")}</p>
          <p className="mt-1 text-xs text-slate-500">{t(lang, "reminder_mobile_note")}</p>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? <p className="text-slate-500">{t(lang, "loading")}</p> : null}
        {error ? <p className="text-red-500">{error}</p> : null}
        {!loading && reminders.length === 0 ? (
          <p className="text-slate-500">{t(lang, "no_reminders")}</p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {reminders.map((task) => (
            <article key={task._id} className="card p-4 sm:p-6 hover-lift">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="font-semibold">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t(lang, "reminder_date_label")}{" "}
                    {new Date(task.reminderAt).toLocaleString()}
                  </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap">
                  <button
                    className="btn-ghost text-xs sm:text-sm"
                    type="button"
                    onClick={() => openReminder(task._id)}
                  >
                    {t(lang, "open_label")}
                  </button>
                  <button className="btn-ghost text-xs sm:text-sm" onClick={() => clearReminder(task._id)}>
                    {t(lang, "reminder_clear")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
