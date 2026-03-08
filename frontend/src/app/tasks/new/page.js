"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { t, useLang } from "../../../lib/i18n";

export default function NewTaskPage() {
  const router = useRouter();
  const lang = useLang();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [isMobilePwa, setIsMobilePwa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function computeMobilePwa() {
      const isMobile =
        window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
      const isStandalone =
        (window.matchMedia &&
          window.matchMedia("(display-mode: standalone)").matches) ||
        window.navigator.standalone === true;
      setIsMobilePwa(Boolean(isMobile && isStandalone));
    }

    computeMobilePwa();
    window.addEventListener("resize", computeMobilePwa);
    return () => window.removeEventListener("resize", computeMobilePwa);
  }, []);

  async function createTask(event) {
  event.preventDefault();
  if (!title.trim()) return;
  setSaving(true);
  setError("");
  try {
    const result = await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        reminderAt: isMobilePwa ? reminderAt || null : null
      })
    });

    // ✅ queued = offline, tâche sauvée localement → on redirige quand même
    if (result?.queued) {
      router.push("/tasks");
      return;
    }

    router.push("/tasks");
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "/login";
      return;
    }
    setError(err.message || t(lang, "create_task_error"));
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <section className="card p-4 sm:p-6 hover-lift">
        <h2 className="text-2xl font-semibold sm:text-3xl">{t(lang, "new_task_title")}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {t(lang, "new_task_subtitle")}
        </p>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={createTask}>
          <input
            className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3"
            placeholder={t(lang, "title_placeholder")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <textarea
            className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3"
            rows={5}
            placeholder={t(lang, "description_placeholder")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          {isMobilePwa ? (
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-600">{t(lang, "reminder_label")}</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                value={reminderAt}
                onChange={(event) => setReminderAt(event.target.value)}
              />
              <p className="text-xs text-slate-500">{t(lang, "reminder_mobile_note")}</p>
            </div>
          ) : null}

          {error ? <p className="sm:col-span-2 text-sm text-red-500">{error}</p> : null}

          <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? t(lang, "loading") : t(lang, "create_task")}
            </button>
            <Link className="btn-ghost" href="/tasks">
              {t(lang, "cancel")}
            </Link>
          </div>
        </form>
      </section>

      <aside className="card p-4 sm:p-6 hover-lift">
        <p className="section-title">{t(lang, "tips_title")}</p>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>{t(lang, "tip_short_title")}</li>
          <li>{t(lang, "tip_auto_status")}</li>
          <li>{t(lang, "tip_add_subtasks")}</li>
          <li>{t(lang, "tip_review_status")}</li>
        </ul>
      </aside>
    </div>
  );
}
