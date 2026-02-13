"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getStatusLabel } from "../../lib/status";

function AdminStatCard({ label, value }) {
  return (
    <div className="panel-soft p-4 hover-lift">
      <p className="section-title">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");
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
      setError("Impossible de charger la vue admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="card p-5 sm:p-6 hover-lift">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Vue globale admin</h2>
            <p className="text-sm text-slate-600">Suivi complet de l'activite applicative.</p>
          </div>
          <button className="btn-ghost" onClick={loadOverview}>
            Actualiser
          </button>
        </div>
      </section>

      {loading ? <p className="text-slate-500">Chargement...</p> : null}
      {error ? <p className="text-red-500">{error}</p> : null}

      {!loading && data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Utilisateurs" value={data.overview.totalUsers} />
            <AdminStatCard label="Taches" value={data.overview.totalTasks} />
            <AdminStatCard label="A faire" value={data.overview.todoTasks} />
            <AdminStatCard label="En cours" value={data.overview.inProgressTasks} />
            <AdminStatCard label="Terminees" value={data.overview.doneTasks} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="card p-5 sm:p-6 hover-lift">
              <h3 className="text-lg font-semibold">Derniers utilisateurs</h3>
              {data.recentUsers.length === 0 ? <p className="mt-4 text-slate-500">Aucun utilisateur recent.</p> : null}
              <ul className="mt-4 space-y-2">
                {data.recentUsers.map((user) => (
                  <li key={user.id} className="panel-soft flex flex-wrap items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{user.email}</p>
                      <p className="text-xs text-slate-500">{new Date(user.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-2 py-1 text-xs uppercase tracking-[0.15em]">
                      {user.role}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card p-5 sm:p-6 hover-lift">
              <h3 className="text-lg font-semibold">Dernieres taches</h3>
              {data.recentTasks.length === 0 ? <p className="mt-4 text-slate-500">Aucune tache recente.</p> : null}
              <ul className="mt-4 space-y-2">
                {data.recentTasks.map((task) => (
                  <li key={task.id} className="panel-soft p-3">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.ownerEmail}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{getStatusLabel(task.status)}</span>
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
