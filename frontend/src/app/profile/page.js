"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { t, useLang } from "../../lib/i18n";

export default function ProfilePage() {
  const lang = useLang();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({ email: "", avatarUrl: "" });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    } catch (err) {
      if (err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setUser(null);
      setError(err.message || t(lang, "profile_load_error"));
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

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setSuccess("");
    try {
      const result = await apiFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({
          email: profile.email,
          avatarUrl: profile.avatarUrl
        })
      });
      if (result?.queued) {
        setSuccess(t(lang, "profile_queued"));
        return;
      }
      setUser((prev) => ({ ...prev, ...result.user }));
      setSuccess(t(lang, "profile_updated"));
    } catch (err) {
      setError(err.message || t(lang, "profile_update_error"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError(t(lang, "password_mismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      const result = await apiFetch("/api/user/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });
      if (result?.queued) {
        setSuccess(t(lang, "password_queued"));
        return;
      }
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(t(lang, "password_updated"));
    } catch (err) {
      setError(err.message || t(lang, "password_update_error"));
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteAccount() {
    const ok = window.confirm(t(lang, "confirm_delete_account"));
    if (!ok) return;
    try {
      await apiFetch("/api/user", { method: "DELETE" });
      window.location.href = "/register";
    } catch (err) {
      setError(err.message || t(lang, "delete_account_error"));
    }
  }

  function onAvatarFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      setError(t(lang, "avatar_too_large"));
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
    <div className="mx-auto w-full max-w-4xl space-y-6 lg:space-y-7">
      <section className="card rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-10 w-1.5 rounded-full bg-cyan-400" />
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">{t(lang, "profile_title")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t(lang, "profile_subtitle")}</p>
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
              <h3 className="text-lg font-semibold">{t(lang, "profile_title")}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {t(lang, "profile_section_subtitle")}
              </p>
            </div>
          </div>
          {loading ? (
            <p className="mt-4 text-slate-500">{t(lang, "loading")}</p>
          ) : (
            <form className="mt-5 grid gap-4" onSubmit={saveProfile}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                <div className="w-full space-y-2 sm:flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full max-w-full text-sm"
                    onChange={onAvatarFile}
                  />
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
                className="w-full max-w-full rounded-xl border border-slate-200 px-4 py-3"
                placeholder={t(lang, "email_label")}
                value={profile.email}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <button className="btn-primary w-full sm:w-auto" type="submit" disabled={savingProfile}>
                  {savingProfile ? t(lang, "loading") : t(lang, "save_profile")}
                </button>
                <button className="btn-ghost w-full sm:w-auto" type="button" onClick={loadUser}>
                  {t(lang, "refresh")}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="card rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-8 w-1.5 rounded-full bg-indigo-400" />
            <div>
              <h3 className="text-lg font-semibold">{t(lang, "password_title")}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {t(lang, "security_subtitle")}
              </p>
            </div>
          </div>
          <form className="mt-5 grid gap-3" onSubmit={savePassword}>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 pr-11"
                placeholder={t(lang, "current_password")}
                value={passwords.currentPassword}
                onChange={(event) =>
                  setPasswords((prev) => ({
                    ...prev,
                    currentPassword: event.target.value
                  }))
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowCurrentPassword((value) => !value)}
                aria-label={showCurrentPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showCurrentPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.06 2.06A11.2 11.2 0 0 0 2 12c2.02 4.5 6.2 7.5 10 7.5 1.77 0 3.47-.44 4.98-1.25l2.49 2.49a.75.75 0 1 0 1.06-1.06l-17-17Zm4.1 4.1 2.23 2.23A3 3 0 0 0 9 12a3 3 0 0 0 3.18 3.17l2.03 2.03A7.7 7.7 0 0 1 12 18c-3.07 0-6.54-2.6-8.4-6 .73-1.41 1.86-2.73 3.03-3.43Zm8.44 8.44-2.17-2.17A3 3 0 0 0 12 9c-.28 0-.55.04-.8.12L8.99 6.9A7.8 7.8 0 0 1 12 6c3.07 0 6.54 2.6 8.4 6-.68 1.3-1.71 2.49-2.33 3.01Z"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 5.5c-3.8 0-7.98 3-10 7.5 2.02 4.5 6.2 7.5 10 7.5s7.98-3 10-7.5c-2.02-4.5-6.2-7.5-10-7.5Zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 pr-11"
                placeholder={t(lang, "new_password")}
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords((prev) => ({
                    ...prev,
                    newPassword: event.target.value
                  }))
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowNewPassword((value) => !value)}
                aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showNewPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.06 2.06A11.2 11.2 0 0 0 2 12c2.02 4.5 6.2 7.5 10 7.5 1.77 0 3.47-.44 4.98-1.25l2.49 2.49a.75.75 0 1 0 1.06-1.06l-17-17Zm4.1 4.1 2.23 2.23A3 3 0 0 0 9 12a3 3 0 0 0 3.18 3.17l2.03 2.03A7.7 7.7 0 0 1 12 18c-3.07 0-6.54-2.6-8.4-6 .73-1.41 1.86-2.73 3.03-3.43Zm8.44 8.44-2.17-2.17A3 3 0 0 0 12 9c-.28 0-.55.04-.8.12L8.99 6.9A7.8 7.8 0 0 1 12 6c3.07 0 6.54 2.6 8.4 6-.68 1.3-1.71 2.49-2.33 3.01Z"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 5.5c-3.8 0-7.98 3-10 7.5 2.02 4.5 6.2 7.5 10 7.5s7.98-3 10-7.5c-2.02-4.5-6.2-7.5-10-7.5Zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 pr-11"
                placeholder={t(lang, "confirm_password")}
                value={passwords.confirmPassword}
                onChange={(event) =>
                  setPasswords((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value
                  }))
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.06 2.06A11.2 11.2 0 0 0 2 12c2.02 4.5 6.2 7.5 10 7.5 1.77 0 3.47-.44 4.98-1.25l2.49 2.49a.75.75 0 1 0 1.06-1.06l-17-17Zm4.1 4.1 2.23 2.23A3 3 0 0 0 9 12a3 3 0 0 0 3.18 3.17l2.03 2.03A7.7 7.7 0 0 1 12 18c-3.07 0-6.54-2.6-8.4-6 .73-1.41 1.86-2.73 3.03-3.43Zm8.44 8.44-2.17-2.17A3 3 0 0 0 12 9c-.28 0-.55.04-.8.12L8.99 6.9A7.8 7.8 0 0 1 12 6c3.07 0 6.54 2.6 8.4 6-.68 1.3-1.71 2.49-2.33 3.01Z"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 5.5c-3.8 0-7.98 3-10 7.5 2.02 4.5 6.2 7.5 10 7.5s7.98-3 10-7.5c-2.02-4.5-6.2-7.5-10-7.5Zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <button className="btn-primary w-full sm:w-auto" type="submit" disabled={savingPassword}>
              {savingPassword ? t(lang, "loading") : t(lang, "change_password")}
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <div className="card rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-8 w-1.5 rounded-full bg-rose-400" />
            <div>
              <h3 className="text-lg font-semibold">{t(lang, "session_title")}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {t(lang, "session_subtitle")}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <button className="btn-ghost w-full sm:w-auto" onClick={logout}>
              {t(lang, "logout")}
            </button>
            <button className="btn-ghost w-full sm:w-auto text-red-600" onClick={deleteAccount}>
              {t(lang, "delete_account")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
