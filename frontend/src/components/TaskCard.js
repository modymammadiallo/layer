"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { t, useLang } from "../lib/i18n";
import { STATUS_EN, STATUS_FR, getStatusLabel } from "../lib/status";

const STATUS_STYLES = {
  todo: "border-amber-200 bg-amber-50 text-amber-700",
  in_progress: "border-cyan-200 bg-cyan-50 text-cyan-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

export default function TaskCard({ task, onChange, showDetails = false }) {
  const router = useRouter();
  const lang = useLang();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [reminderAt, setReminderAt] = useState(task.reminderAt ? toLocalDateTime(task.reminderAt) : "");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collabMessage, setCollabMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reminderEditorOpen, setReminderEditorOpen] = useState(false);
  const [isMobilePwa, setIsMobilePwa] = useState(false);
  const reminderTimer = useRef(null);
  const statusLabels = lang === "en" ? STATUS_EN : STATUS_FR;
  const hasReminder = Boolean(task.reminderAt);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick() {
      setMenuOpen(false);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    setReminderAt(task.reminderAt ? toLocalDateTime(task.reminderAt) : "");
  }, [task.reminderAt]);

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

  async function save() {
    await apiFetch(`/api/tasks/${task._id}`, {
      method: "PUT",
      body: JSON.stringify({ title, description, status, reminderAt: reminderAt || null })
    });
    scheduleReminder(reminderAt);
    setEditing(false);
    onChange();
  }

  async function remove() {
    await apiFetch(`/api/tasks/${task._id}`, { method: "DELETE" });
    onChange();
  }

  async function addSubtask(event) {
    event.preventDefault();
    if (!canManageSubtasks) return;
    if (!subtaskTitle.trim()) return;
    await apiFetch(`/api/tasks/${task._id}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title: subtaskTitle })
    });
    setSubtaskTitle("");
    onChange();
  }

  async function toggleSubtask(subtask) {
    if (!canManageSubtasks) return;
    await apiFetch(`/api/tasks/${task._id}/subtasks/${subtask._id}`, {
      method: "PUT",
      body: JSON.stringify({ completed: !subtask.completed })
    });
    onChange();
  }

  async function deleteSubtask(subtask) {
    if (!canManageSubtasks) return;
    await apiFetch(`/api/tasks/${task._id}/subtasks/${subtask._id}`, {
      method: "DELETE"
    });
    onChange();
  }

  const canEditTask = task.canEditTask !== false;
  const canDeleteTask = task.canDeleteTask !== false;
  const canManageCollaborators = Boolean(task.canManageCollaborators);
  const canManageSubtasks = task.canManageSubtasks !== false;
  const canRespondInvite = Boolean(task.canRespondInvite);
  const canToggleStandalone = canEditTask && (task.subtasks?.length || 0) === 0;
  const hasTaskActions = canToggleStandalone || canEditTask || canDeleteTask;

  async function addCollaborator(event) {
    event.preventDefault();
    const email = collaboratorEmail.trim().toLowerCase();
    if (!email) return;
    setCollabMessage("");
    try {
      await apiFetch(`/api/tasks/${task._id}/collaborators`, {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setCollaboratorEmail("");
      onChange();
    } catch (err) {
      setCollabMessage(err.message || "Request failed");
    }
  }

  async function removeCollaborator(collaboratorId) {
    setCollabMessage("");
    try {
      await apiFetch(`/api/tasks/${task._id}/collaborators/${collaboratorId}`, {
        method: "DELETE"
      });
      onChange();
    } catch (err) {
      setCollabMessage(err.message || "Request failed");
    }
  }

  async function respondInvitation(action) {
    setCollabMessage("");
    try {
      await apiFetch(
        `/api/tasks/${task._id}/collaborators/${task.currentUserId}/respond`,
        {
          method: "POST",
          body: JSON.stringify({ action })
        }
      );
      onChange();
    } catch (err) {
      setCollabMessage(err.message || "Request failed");
    }
  }

  async function toggleStandaloneDone() {
    const nextStatus = task.status === "done" ? "todo" : "done";
    await apiFetch(`/api/tasks/${task._id}`, {
      method: "PUT",
      body: JSON.stringify({ status: nextStatus })
    });
    onChange();
  }

  async function saveReminder() {
    await apiFetch(`/api/tasks/${task._id}`, {
      method: "PUT",
      body: JSON.stringify({ reminderAt: reminderAt || null })
    });
    scheduleReminder(reminderAt);
    onChange();
  }

  async function clearReminder() {
    setReminderAt("");
    await apiFetch(`/api/tasks/${task._id}`, {
      method: "PUT",
      body: JSON.stringify({ reminderAt: null })
    });
    onChange();
  }

  function toLocalDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function scheduleReminder(value) {
    if (!showDetails || !value) return;
    if (!isMobilePwa) return;
    const when = new Date(value).getTime();
    if (Number.isNaN(when)) return;
    const delay = when - Date.now();
    if (delay <= 0) return;
    if (reminderTimer.current) {
      clearTimeout(reminderTimer.current);
      reminderTimer.current = null;
    }
    if (!("Notification" in window)) return;
    const ensurePermission = Notification.permission === "granted"
      ? Promise.resolve("granted")
      : Notification.requestPermission();
    ensurePermission.then((permission) => {
      if (permission !== "granted") return;
      navigator.serviceWorker?.ready.then((reg) => {
        reminderTimer.current = setTimeout(() => {
          reg.showNotification(task.title, {
            body: task.description || "",
            icon: "/icons/icon-192.png"
          });
        }, delay);
      });
    });
  }

  useEffect(() => {
    scheduleReminder(reminderAt);
    return () => {
      if (reminderTimer.current) {
        clearTimeout(reminderTimer.current);
      }
    };
  }, [reminderAt, showDetails, isMobilePwa]);

  return (
    <article
      className={`card p-4 sm:p-6 hover-lift relative overflow-visible ${menuOpen ? "z-[120]" : ""}`}
      onClick={() => {
        setMenuOpen(false);
        if (!showDetails && !editing) {
          router.push(`/task/${task._id}`);
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {editing ? (
            <>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-semibold"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onClick={(event) => event.stopPropagation()}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onClick={(event) => event.stopPropagation()}
              />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{task.title}</h3>
                {!showDetails && hasReminder ? (
                  <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                      />
                    </svg>
                    {t(lang, "reminder_label")}
                  </span>
                ) : null}
              </div>
              {showDetails ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-1 text-sm sm:text-xs font-medium ${STATUS_STYLES[task.status] || STATUS_STYLES.todo}`}>
                      {getStatusLabel(task.status, lang)}
                    </span>
                  </div>
                  <p className="text-slate-600">{task.description || t(lang, "no_description")}</p>
                </>
              ) : null}
            </>
          )}
        </div>
        <div className="flex w-full flex-col items-end gap-2 sm:w-auto sm:items-end">
          {editing ? (
            <select
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              onClick={(event) => event.stopPropagation()}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : null}

          <div className="relative" onClick={(event) => event.stopPropagation()}>
            {hasTaskActions ? (
              <button
                type="button"
                className="btn-ghost px-3"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((value) => !value);
                }}
                aria-label={t(lang, "options")}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M5 12a2 2 0 1 0 0 .01V12Zm7 0a2 2 0 1 0 0 .01V12Zm7 0a2 2 0 1 0 0 .01V12Z"
                  />
                </svg>
              </button>
            ) : null}
            {menuOpen && hasTaskActions ? (
              <div className="menu-pop absolute right-0 bottom-full mb-2 z-[140] w-44 rounded-2xl p-2 shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2">
                {!editing && canToggleStandalone ? (
                  <button
                    type="button"
                    className="menu-item block w-full rounded-xl px-3 py-2 text-left text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen(false);
                      toggleStandaloneDone();
                    }}
                  >
                    {task.status === "done" ? t(lang, "reopen_task") : t(lang, "mark_done")}
                  </button>
                ) : null}
                {canEditTask && editing ? (
                  <button
                    type="button"
                    className="menu-item block w-full rounded-xl px-3 py-2 text-left text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen(false);
                      save();
                    }}
                  >
                    {t(lang, "save_label")}
                  </button>
                ) : null}
                {canEditTask && !editing ? (
                  <button
                    type="button"
                    className="menu-item block w-full rounded-xl px-3 py-2 text-left text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                  >
                    {t(lang, "edit")}
                  </button>
                ) : null}
                {canEditTask && isMobilePwa && showDetails ? (
                  <button
                    type="button"
                    className="menu-item block w-full rounded-xl px-3 py-2 text-left text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen(false);
                      setReminderEditorOpen((value) => !value);
                    }}
                  >
                    {t(lang, "reminder_menu")}
                  </button>
                ) : null}
                {canDeleteTask ? (
                  <button
                    type="button"
                    className="menu-item block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen(false);
                      remove();
                    }}
                  >
                    {t(lang, "delete_label")}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showDetails ? (
        <div className="mt-6 space-y-3">
          {canRespondInvite ? (
            <div className="panel-soft space-y-3 px-3 py-3">
              <p className="text-sm text-slate-700">{t(lang, "collaborator_invite_pending")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-accent text-xs sm:text-sm"
                  onClick={() => respondInvitation("accept")}
                >
                  {t(lang, "collaborator_accept")}
                </button>
                <button
                  type="button"
                  className="btn-ghost text-xs sm:text-sm text-red-600"
                  onClick={() => respondInvitation("reject")}
                >
                  {t(lang, "collaborator_reject")}
                </button>
              </div>
            </div>
          ) : null}

          {canManageCollaborators ? (
            <>
              <h4 className="section-title">{t(lang, "collaborators_title")}</h4>
              {(task.collaborators || []).length === 0 ? (
                <p className="text-sm text-slate-500">{t(lang, "no_collaborators")}</p>
              ) : (
                <ul className="space-y-2">
                  {(task.collaborators || []).map((collaborator) => (
                    <li key={collaborator.userId} className="panel-soft flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{collaborator.email}</p>
                        <p className="text-xs text-slate-500">
                          {collaborator.status === "pending"
                            ? t(lang, "collaborator_pending")
                            : t(lang, "collaborator_accepted")}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-xs sm:text-sm text-red-500"
                        onClick={() => removeCollaborator(collaborator.userId)}
                      >
                        {t(lang, "delete_label")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <h4 className="section-title">{t(lang, "collaborators_available")}</h4>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addCollaborator}>
                <input
                  type="email"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                  placeholder={t(lang, "collaborator_search")}
                  value={collaboratorEmail}
                  onChange={(event) => setCollaboratorEmail(event.target.value)}
                />
                <button type="submit" className="btn-accent text-xs sm:text-sm">
                  {t(lang, "collaborator_add")}
                </button>
              </form>
            </>
          ) : null}
          {collabMessage ? <p className="text-sm text-red-500">{collabMessage}</p> : null}

          <h4 className="section-title">{t(lang, "subtasks_title")}</h4>
          {!canManageSubtasks ? (
            <p className="text-sm text-slate-500">{t(lang, "collaborator_accept_required")}</p>
          ) : null}
          {task.subtasks.length === 0 && (
            <p className="text-sm text-slate-500">{t(lang, "no_subtasks")}</p>
          )}
          <ul className="space-y-2">
            {task.subtasks.map((subtask) => (
              <li
                key={subtask._id}
                className="panel-soft flex items-start justify-between gap-3 px-3 py-2"
              >
                <label className="flex min-w-0 flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(subtask)}
                    disabled={!canManageSubtasks}
                  />
                  <span className={`break-words text-sm leading-5 ${subtask.completed ? "line-through text-slate-400" : ""}`}>{subtask.title}</span>
                </label>
                <button
                  className="shrink-0 text-xs sm:text-sm text-red-500 disabled:opacity-50"
                  onClick={() => deleteSubtask(subtask)}
                  disabled={!canManageSubtasks}
                >
                  {t(lang, "delete_label")}
                </button>
              </li>
            ))}
          </ul>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addSubtask}>
            <input
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
              placeholder={t(lang, "new_subtask_placeholder")}
              value={subtaskTitle}
              onChange={(event) => setSubtaskTitle(event.target.value)}
              disabled={!canManageSubtasks}
            />
            <button className="btn-accent" type="submit" disabled={!canManageSubtasks}>
              {t(lang, "add_label")}
            </button>
          </form>

          {canEditTask && isMobilePwa && reminderEditorOpen ? (
            <div className="mt-4 space-y-2">
              <p className="section-title">{t(lang, "reminder_label")}</p>
              <p className="text-sm text-slate-600">{t(lang, "reminder_help")}</p>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={reminderAt}
                onChange={(event) => setReminderAt(event.target.value)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-accent text-sm"
                  onClick={saveReminder}
                >
                  {t(lang, "save_label")}
                </button>
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  onClick={clearReminder}
                >
                  {t(lang, "reminder_clear")}
                </button>
                <span className="text-[11px] sm:text-xs text-slate-500">{t(lang, "reminder_mobile_note")}</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
