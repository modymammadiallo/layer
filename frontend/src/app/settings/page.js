"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { t, useLang } from "../../lib/i18n";

export default function SettingsPage() {
  const lang = useLang();
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [prefs, setPrefs] = useState({
    theme: "system",
    language: "fr",
    notifications: "none",
    density: "comfortable",
    timezone: "auto"
  });

  async function loadUser() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiFetch("/api/user/me");
      setPrefs({
        theme: data.user?.preferences?.theme || "system",
        language: data.user?.preferences?.language || "fr",
        notifications: data.user?.preferences?.notifications || "none",
        density: data.user?.preferences?.density || "comfortable",
        timezone: data.user?.preferences?.timezone || "auto"
      });
    } catch (err) {
      if (err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err.message || t(lang, "settings_load_error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    function handleSync() {
      loadUser();
    }
    window.addEventListener("app:sync", handleSync);
    return () => window.removeEventListener("app:sync", handleSync);
  }, []);

  async function savePrefs(event) {
    event.preventDefault();
    setSavingPrefs(true);
    setError("");
    setSuccess("");
    try {
      const result = await apiFetch("/api/user/settings", {
        method: "PUT",
        body: JSON.stringify(prefs)
      });
      const root = document.documentElement;
      root.dataset.theme = prefs.theme;
      root.dataset.density = prefs.density;
      const systemDark = window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark = prefs.theme === "dark" || (prefs.theme === "system" && systemDark);
      if (shouldDark) {
        root.classList.add("theme-dark");
      } else {
        root.classList.remove("theme-dark");
      }
      root.dataset.lang = prefs.language;
      root.lang = prefs.language;
      window.dispatchEvent(new Event("preferences:updated"));
      if (result?.queued) {
        setSuccess(t(lang, "settings_queued"));
      } else {
        setSuccess(t(prefs.language, "settings_saved"));
      }
    } catch (err) {
      setError(err.message || t(lang, "settings_save_error"));
    } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 lg:space-y-7">
      <section className="card rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-10 w-1.5 rounded-full bg-emerald-400" />
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {t(lang, "settings_title")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {t(lang, "settings_subtitle")}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <section className="alert-error rounded-3xl p-4 text-sm">{error}</section>
      )}
      {success && (
        <section className="alert-success rounded-3xl p-4 text-sm">{success}</section>
      )}

      <section className="space-y-4">
        <div className="card rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-8 w-1.5 rounded-full bg-amber-400" />
            <div>
              <h3 className="text-lg font-semibold">{t(lang, "prefs_title")}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {t(lang, "preferences_section_subtitle")}
              </p>
            </div>
          </div>
          {loading ? (
            <p className="mt-4 text-slate-500">{t(lang, "loading")}</p>
          ) : (
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={savePrefs}>
              <label className="space-y-2 text-sm">
                {t(lang, "theme_label")}
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  value={prefs.theme}
                  onChange={(event) =>
                    setPrefs((prev) => ({ ...prev, theme: event.target.value }))
                  }
                >
                  <option value="system">{t(lang, "theme_system")}</option>
                  <option value="light">{t(lang, "theme_light")}</option>
                  <option value="dark">{t(lang, "theme_dark")}</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                {t(lang, "language_label")}
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  value={prefs.language}
                  onChange={(event) =>
                    setPrefs((prev) => ({ ...prev, language: event.target.value }))
                  }
                >
                  <option value="fr">{t(lang, "language_fr")}</option>
                  <option value="en">{t(lang, "language_en")}</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                {t(lang, "notifications_label")}
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  value={prefs.notifications}
                  onChange={(event) =>
                    setPrefs((prev) => ({
                      ...prev,
                      notifications: event.target.value
                    }))
                  }
                >
                  <option value="none">{t(lang, "notifications_none")}</option>
                  <option value="email">{t(lang, "notifications_email")}</option>
                  <option value="push">{t(lang, "notifications_push")}</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                {t(lang, "density_label")}
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  value={prefs.density}
                  onChange={(event) =>
                    setPrefs((prev) => ({ ...prev, density: event.target.value }))
                  }
                >
                  <option value="comfortable">{t(lang, "density_comfortable")}</option>
                  <option value="compact">{t(lang, "density_compact")}</option>
                </select>
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                {t(lang, "timezone_label")}
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  placeholder="auto"
                  value={prefs.timezone}
                  onChange={(event) =>
                    setPrefs((prev) => ({ ...prev, timezone: event.target.value }))
                  }
                />
              </label>
              <div className="sm:col-span-2">
                <button className="btn-primary" type="submit" disabled={savingPrefs}>
                  {savingPrefs ? t(lang, "loading") : t(lang, "save")}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
