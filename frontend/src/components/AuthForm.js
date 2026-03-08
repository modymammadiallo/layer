"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../lib/api";
import { t, useLang } from "../lib/i18n";

export default function AuthForm({ mode }) {
  const lang = useLang();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeMode, setActiveMode] = useState(mode);

  const isRegister = activeMode === "register";
  const hero = useMemo(() => ({
    kicker: t(lang, "hero_kicker"),
    title: t(lang, "hero_title"),
    description: t(lang, "hero_description"),
    highlights: [
      { label: t(lang, "nav_overview"), value: t(lang, "hero_highlight_one") },
      { label: t(lang, "nav_tasks"), value: t(lang, "hero_highlight_two") },
      { label: "PWA", value: t(lang, "hero_highlight_three") }
    ],
    accents: [
      "bg-cyan-200/50",
      "bg-slate-200/60"
    ]
  }), [lang]);
  const nextPath = useMemo(() => {
    const raw = searchParams.get("next") || "/dashboard";
    if (!raw.startsWith("/")) return "/dashboard";
    return raw;
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function checkExistingSession() {
      try {
        const data = await apiFetch("/api/auth/me");
        if (!cancelled && data?.user) {
          window.location.href = nextPath;
          return;
        }
      } catch {
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }
    checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  async function onSubmit(event) {
  event.preventDefault();
  setError("");
  if (isRegister && password !== confirmPassword) {
    setError(t(lang, "password_mismatch"));
    return;
  }
  setLoading(true);
  try {
    await apiFetch(`/api/auth/${isRegister ? "register" : "login"}`, {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    window.location.href = nextPath;
  } catch (err) {
    if (err.status === 403) {
      setError(t(lang, "account_suspended_error"));
      return;
    }
    setError(err.message || t(lang, "auth_invalid_error"));
  } finally {
    setLoading(false);
  }
}

  if (checkingSession) {
    return (
      <section className="card mx-auto w-full max-w-md p-8 text-center">
        <p className="section-title">Layer</p>
        <h2 className="mt-3 text-xl font-semibold">{t(lang, "login_secure_title")}</h2>
        <p className="mt-2 text-sm text-slate-600">{t(lang, "checking_session")}</p>
      </section>
    );
  }

  const formCard = (centered = false) => (
    <form onSubmit={onSubmit} className="card h-fit p-8">
      <h3 className={`text-2xl font-semibold${centered ? " text-center" : ""}`}>
        {isRegister ? t(lang, "register_title") : t(lang, "login_title")}
      </h3>
      <p className={`mt-2 text-sm text-slate-600${centered ? " text-center" : ""}`}>
        {isRegister ? t(lang, "register_subtitle") : t(lang, "login_subtitle")}
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t(lang, "email_label")}</span>
          <input
            type="email"
            required
            placeholder={t(lang, "email_placeholder")}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">{t(lang, "password_title")}</span>
          <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder={t(lang, "password_placeholder")}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
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
        </label>
        {isRegister ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">{t(lang, "confirm_password")}</span>
            <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder={t(lang, "password_placeholder")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
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
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

      <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
        {loading ? t(lang, "loading") : isRegister ? t(lang, "register_title") : t(lang, "login_title")}
      </button>

      <a className="mt-4 block text-center text-sm text-slate-600 underline" href={isRegister ? "/login" : "/register"}>
        {isRegister ? t(lang, "already_registered") : t(lang, "create_account")}
      </a>
    </form>
  );

  return (
    <section className="relative space-y-6 sm:space-y-0">
      {showMobileModal ? (
        <div className="sm:hidden fixed inset-0 z-50" onClick={() => setShowMobileModal(false)}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center p-5">
            <div className="relative w-full max-w-sm">
              <button
                type="button"
                className="absolute -right-3 -top-3 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-md"
                onClick={() => setShowMobileModal(false)}
                aria-label="Fermer"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.59 7.1 5.7a1 1 0 0 0-1.4 1.4L10.59 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.41l4.9 4.9a1 1 0 0 0 1.4-1.4L13.41 12l4.9-4.9a1 1 0 0 0-.01-1.4Z"
                  />
                </svg>
              </button>
              <div onClick={(event) => event.stopPropagation()}>
                {formCard(true)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card relative overflow-hidden p-8">
          <div className="absolute right-4 top-4 sm:hidden">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
              onClick={() => setShowMobileMenu((value) => !value)}
              aria-label="Menu"
              title="Menu"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M4 7a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm1 4a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5Z"
                />
              </svg>
            </button>
            {showMobileMenu ? (
              <div className="menu-pop absolute right-0 mt-2 w-44 rounded-2xl p-2 shadow-lg">
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onClick={() => {
                    setShowMobileMenu(false);
                    setActiveMode("login");
                    setShowMobileModal(true);
                  }}
                >
                  {t(lang, "login_title")}
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onClick={() => {
                    setShowMobileMenu(false);
                    setActiveMode("register");
                    setShowMobileModal(true);
                  }}
                >
                  {t(lang, "register_title")}
                </button>
              </div>
            ) : null}
          </div>
          <div className={`pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full blur-3xl ${hero.accents[0]}`} />
          <div className={`pointer-events-none absolute -right-12 bottom-8 h-44 w-44 rounded-full blur-3xl ${hero.accents[1]}`} />
          <p className="section-title">{hero.kicker}</p>
          <h2 className="mt-3 text-3xl font-semibold">{hero.title}</h2>
          <p className="mt-3 max-w-xl text-sm text-slate-600">{hero.description}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {hero.highlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

        </div>

        <div className="hidden sm:block">{formCard()}</div>
      </div>
    </section>
  );
}



