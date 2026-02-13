"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/api";

const STATUS_LABELS = {
  todo: "A faire",
  in_progress: "En cours",
  done: "Termine"
};

export default function NewTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description, status })
      });
      window.location.href = "/tasks";
    } catch (err) {
      if (err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError("Impossible de creer la tache.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <section className="card p-6 hover-lift">
        <h2 className="text-2xl font-semibold sm:text-3xl">Nouvelle tache</h2>
        <p className="mt-2 text-sm text-slate-600">
          Creez une tache claire, puis ajoutez des sous-taches pour suivre l'avancement.
        </p>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={createTask}>
          <input
            className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3"
            placeholder="Titre"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <select
            className="rounded-xl border border-slate-200 px-4 py-3"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <textarea
            className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3"
            rows={5}
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          {error ? <p className="sm:col-span-2 text-sm text-red-500">{error}</p> : null}

          <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Creation..." : "Creer"}
            </button>
            <a className="btn-ghost" href="/tasks">
              Annuler
            </a>
          </div>
        </form>
      </section>

      <aside className="card p-6 hover-lift">
        <p className="section-title">Conseils</p>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Donne un titre court et actionnable.</li>
          <li>Commence en statut "A faire" pour mieux prioriser.</li>
          <li>Ajoute les sous-taches ensuite depuis le detail.</li>
          <li>Revois les statuts chaque jour pour garder une vue fiable.</li>
        </ul>
      </aside>
    </div>
  );
}
