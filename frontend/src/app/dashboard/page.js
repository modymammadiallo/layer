"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getStatusLabel } from "../../lib/status";

export default function DashboardPage() {
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
      setError("Impossible de charger les taches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8">
      <section className="card p-6 hover-lift">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Pilotage global</h2>
            <p className="text-sm text-slate-600">
              {stats.total} taches, {stats.inProgress} en cours, {stats.done} terminees.
            </p>
          </div>
          <button className="btn-ghost" onClick={logout}>
            Deconnexion
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
            <span>Taux d'achevement</span>
            <span>{stats.completionRate}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="panel-soft p-4 hover-lift">
            <p className="section-title">Total</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="panel-soft p-4 hover-lift">
            <p className="section-title">A faire</p>
            <p className="mt-2 text-2xl font-semibold">{stats.todo}</p>
          </div>
          <div className="panel-soft p-4 hover-lift">
            <p className="section-title">En cours</p>
            <p className="mt-2 text-2xl font-semibold">{stats.inProgress}</p>
          </div>
          <div className="panel-soft p-4 hover-lift">
            <p className="section-title">Terminees</p>
            <p className="mt-2 text-2xl font-semibold">{stats.done}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <article className="card p-6 hover-lift">
          <h3 className="text-lg font-semibold">Actions rapides</h3>
          <p className="mt-2 text-sm text-slate-600">Accede aux modules les plus utilises.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a className="btn-primary text-center" href="/tasks/new">
              Creer une tache
            </a>
            <a className="btn-ghost text-center" href="/tasks">
              Ouvrir la liste
            </a>
            <a className="btn-ghost text-center" href="/settings">
              Parametres
            </a>
            <button className="btn-ghost" onClick={loadTasks}>
              Synchroniser
            </button>
          </div>
        </article>

        <article className="card p-6 hover-lift">
          <h3 className="text-lg font-semibold">Dernieres taches</h3>
          {loading ? <p className="mt-3 text-slate-500">Chargement...</p> : null}
          {error ? <p className="mt-3 text-red-500">{error}</p> : null}
          {!loading && !error && recentTasks.length === 0 ? (
            <p className="mt-3 text-slate-500">Aucune tache pour le moment.</p>
          ) : null}
          <ul className="mt-3 space-y-2">
            {recentTasks.map((task) => (
              <li key={task._id} className="panel-soft flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-slate-500">{getStatusLabel(task.status)}</p>
                </div>
                <a className="btn-ghost" href={`/task/${task._id}`}>
                  Ouvrir
                </a>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

