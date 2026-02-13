"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import TaskCard from "../../components/TaskCard";

const FILTERS = ["all", "todo", "in_progress", "done"];

const FILTER_LABELS = {
  all: "Tous",
  todo: "A faire",
  in_progress: "En cours",
  done: "Terminee"
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

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

  const filteredTasks = useMemo(() => {
    const byStatus = filter === "all" ? tasks : tasks.filter((task) => task.status === filter);
    const term = query.trim().toLowerCase();
    if (!term) return byStatus;
    return byStatus.filter((task) => {
      const title = task.title?.toLowerCase() || "";
      const desc = task.description?.toLowerCase() || "";
      return title.includes(term) || desc.includes(term);
    });
  }, [tasks, filter, query]);

  return (
    <div className="space-y-6">
      <section className="card p-6 hover-lift">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Gestion des taches</h2>
            <p className="text-sm text-slate-600">{filteredTasks.length} resultat(s) sur {tasks.length} taches.</p>
          </div>
          <a className="btn-primary" href="/tasks/new">
            Nouvelle tache
          </a>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-xl border border-slate-200 px-4 py-3"
            placeholder="Rechercher par titre ou description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((value) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={active ? "btn-primary" : "btn-ghost"}
                  onClick={() => setFilter(value)}
                >
                  {FILTER_LABELS[value] || value}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? <p className="text-slate-500">Chargement...</p> : null}
        {error ? <p className="text-red-500">{error}</p> : null}
        {!loading && filteredTasks.length === 0 ? (
          <p className="text-slate-500">Aucune tache correspondante.</p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} onChange={loadTasks} />
          ))}
        </div>
      </section>
    </div>
  );
}
