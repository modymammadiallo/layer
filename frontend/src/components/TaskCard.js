"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

const STATUS_LABELS = {
  todo: "A faire",
  in_progress: "En cours",
  done: "Termine"
};

const STATUS_STYLES = {
  todo: "border-amber-200 bg-amber-50 text-amber-700",
  in_progress: "border-cyan-200 bg-cyan-50 text-cyan-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

export default function TaskCard({ task, onChange }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  async function save() {
    await apiFetch(`/api/tasks/${task._id}`, {
      method: "PUT",
      body: JSON.stringify({ title, description, status })
    });
    setEditing(false);
    onChange();
  }

  async function remove() {
    await apiFetch(`/api/tasks/${task._id}`, { method: "DELETE" });
    onChange();
  }

  async function addSubtask(event) {
    event.preventDefault();
    if (!subtaskTitle.trim()) return;
    await apiFetch(`/api/tasks/${task._id}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title: subtaskTitle })
    });
    setSubtaskTitle("");
    onChange();
  }

  async function toggleSubtask(subtask) {
    await apiFetch(`/api/tasks/${task._id}/subtasks/${subtask._id}`, {
      method: "PUT",
      body: JSON.stringify({ completed: !subtask.completed })
    });
    onChange();
  }

  async function deleteSubtask(subtask) {
    await apiFetch(`/api/tasks/${task._id}/subtasks/${subtask._id}`, {
      method: "DELETE"
    });
    onChange();
  }

  return (
    <article className="card p-6 hover-lift">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${STATUS_STYLES[task.status] || STATUS_STYLES.todo}`}>
              {STATUS_LABELS[task.status] || task.status}
            </span>
          </div>
          {editing ? (
            <>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-semibold"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold">{task.title}</h3>
              <p className="text-slate-600">{task.description || "Aucune description."}</p>
            </>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={!editing}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {editing ? (
              <button className="btn-primary" onClick={save}>
                Enregistrer
              </button>
            ) : (
              <button className="btn-ghost" onClick={() => setEditing(true)}>
                Modifier
              </button>
            )}
            <a className="btn-ghost text-center" href={`/task/${task._id}`}>
              Ouvrir
            </a>
            <button className="btn-ghost text-red-600" onClick={remove}>
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="section-title">Sous-taches</h4>
        {task.subtasks.length === 0 && (
          <p className="text-sm text-slate-500">Aucune sous-tache pour le moment.</p>
        )}
        <ul className="space-y-2">
          {task.subtasks.map((subtask) => (
            <li
              key={subtask._id}
              className="panel-soft flex items-center justify-between px-3 py-2"
            >
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={subtask.completed} onChange={() => toggleSubtask(subtask)} />
                <span className={subtask.completed ? "line-through text-slate-400" : ""}>{subtask.title}</span>
              </label>
              <button className="text-sm text-red-500" onClick={() => deleteSubtask(subtask)}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addSubtask}>
          <input
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
            placeholder="Nouvelle sous-tache"
            value={subtaskTitle}
            onChange={(event) => setSubtaskTitle(event.target.value)}
          />
          <button className="btn-accent" type="submit">
            Ajouter
          </button>
        </form>
      </div>
    </article>
  );
}
