"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import TaskCard from "../../../components/TaskCard";

export default function TaskDetailPage({ params }) {
  const { id } = params;
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

  if (loading) {
    return <p className="text-slate-500">Chargement...</p>;
  }

  if (!task) {
    return <p className="text-red-500">Tache introuvable.</p>;
  }

  return (
    <div className="space-y-4">
      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a className="btn-ghost" href="/tasks">
            Retour a la liste
          </a>
          <span className="text-sm text-slate-500">ID: {task._id}</span>
        </div>
      </section>
      <TaskCard task={task} onChange={loadTask} />
    </div>
  );
}
