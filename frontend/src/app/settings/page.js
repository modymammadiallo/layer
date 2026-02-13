"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { t, useLang } from "../../lib/i18n";

export default function SettingsPage() {
  const lang = useLang();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({ email: "", avatarUrl: "" });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
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
      setUser(data.user);
      setProfile({
        email: data.user?.email || "",
        avatarUrl: data.user?.avatarUrl || ""
      });
      setAvatarPreview(data.user?.avatarUrl || "");
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
      setUser(null);
      setError("Impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({
          email: profile.email,
          avatarUrl: profile.avatarUrl
        })
      });
      setUser((prev) => ({ ...prev, ...data.user }));
      setSuccess("Profil mis a jour.");
    } catch (err) {
      setError("Impossible de mettre a jour le profil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSavingPassword(true);
    try {
      await apiFetch("/api/user/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Mot de passe modifie.");
    } catch (err) {
      setError("Impossible de changer le mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function savePrefs(event) {
    event.preventDefault();
    setSavingPrefs(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch("/api/user/settings", {
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
      setSuccess(t(prefs.language, "settings_saved"));
    } catch (err) {
      setError("Impossible d'enregistrer les parametres.");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function deleteAccount() {
    const ok = window.confirm(
      "Supprimer le compte et toutes les taches ? Cette action est irreversible."
    );
    if (!ok) return;
    try {
      await apiFetch("/api/user", { method: "DELETE" });
      window.location.href = "/register";
    } catch (err) {
      setError("Impossible de supprimer le compte.");
    }
  }

  function onAvatarFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      setError("L'image doit faire moins de 200KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || "";
      setAvatarPreview(result);
      setProfile((prev) => ({ ...prev, avatarUrl: result }));
    };
    reader.readAsDataURL(file);
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="card p-5 sm:p-6 hover-lift">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          {t(lang, "settings_title")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {t(lang, "settings_subtitle")}
        </p>
      </section>

      {error && (
        <section className="card p-4 text-sm text-red-600">{error}</section>
      )}
      {success && (
        <section className="card p-4 text-sm text-emerald-600">
          {success}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="card p-5 sm:p-6 hover-lift">
          <h3 className="text-lg font-semibold">{t(lang, "profile_title")}</h3>
          {loading ? (
            <p className="mt-4 text-slate-500">Chargement...</p>
          ) : (
            <form className="mt-4 grid gap-4" onSubmit={saveProfile}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      {t(lang, "avatar_label")}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input type="file" accept="image/*" onChange={onAvatarFile} />
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                    placeholder={t(lang, "avatar_url")}
                    value={profile.avatarUrl}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        avatarUrl: event.target.value
                      }))
                    }
                  />
                </div>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                placeholder={t(lang, "email_label")}
                value={profile.email}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="btn-primary" type="submit" disabled={savingProfile}>
                  {savingProfile ? "Sauvegarde..." : t(lang, "save_profile")}
                </button>
                <button className="btn-ghost" type="button" onClick={loadUser}>
                  {t(lang, "refresh")}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card p-5 sm:p-6 hover-lift">
          <h3 className="text-lg font-semibold">{t(lang, "password_title")}</h3>
          <form className="mt-4 grid gap-3" onSubmit={savePassword}>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder={t(lang, "current_password")}
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((prev) => ({
                  ...prev,
                  currentPassword: event.target.value
                }))
              }
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder={t(lang, "new_password")}
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((prev) => ({
                  ...prev,
                  newPassword: event.target.value
                }))
              }
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder={t(lang, "confirm_password")}
              value={passwords.confirmPassword}
              onChange={(event) =>
                setPasswords((prev) => ({
                  ...prev,
                  confirmPassword: event.target.value
                }))
              }
            />
            <button className="btn-primary" type="submit" disabled={savingPassword}>
              {savingPassword ? "Mise a jour..." : "Changer le mot de passe"}
            </button>
          </form>
        </div>
      </section>

      <section className="card p-5 sm:p-6 hover-lift">
        <h3 className="text-lg font-semibold">{t(lang, "prefs_title")}</h3>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={savePrefs}>
          <label className="space-y-2 text-sm">
            {t(lang, "theme_label")}
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-2"
              value={prefs.theme}
              onChange={(event) =>
                setPrefs((prev) => ({ ...prev, theme: event.target.value }))
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
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
              <option value="fr">Francais</option>
              <option value="en">English</option>
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
              <option value="none">None</option>
              <option value="email">Email</option>
              <option value="push">Push</option>
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
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
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
          <div className="sm:col-span-2 flex flex-wrap gap-3">
            <button className="btn-primary" type="submit" disabled={savingPrefs}>
              {savingPrefs ? "Sauvegarde..." : t(lang, "save")}
            </button>
          </div>
        </form>
      </section>

      <section className="card p-5 sm:p-6 hover-lift">
        <h3 className="text-lg font-semibold">{t(lang, "session_title")}</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-ghost" onClick={logout}>
            {t(lang, "logout")}
          </button>
          <button className="btn-ghost text-red-600" onClick={deleteAccount}>
            {t(lang, "delete_account")}
          </button>
        </div>
      </section>
    </div>
  );
}

