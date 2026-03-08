"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { t, useLang } from "../../../lib/i18n";
import TaskCard from "../../../components/TaskCard";

export default function TaskDetailPage({ params }) {
  const { id } = params;
  const lang = useLang();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadTask() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/tasks/${id}`);
      setTask(data.task);
    } catch (err) {
      if (err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setTask(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTask();
  }, [id]);

  useEffect(() => {
    function handleSync() {
      loadTask();
    }
    window.addEventListener("app:sync", handleSync);
    return () => window.removeEventListener("app:sync", handleSync);
  }, [id]);

  if (loading) {
    return <p className="text-slate-500">{t(lang, "loading")}</p>;
  }

  if (!task) {
    return <p className="text-red-500">{t(lang, "task_not_found")}</p>;
  }

  return (
    <div className="space-y-4">
      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className="btn-ghost" href="/tasks">
            {t(lang, "back_to_list")}
          </Link>
        </div>
      </section>
      <TaskCard task={task} onChange={loadTask} showDetails />
    </div>
  );
}
