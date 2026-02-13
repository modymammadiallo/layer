"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../lib/api";

export default function AuthForm({ mode }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const isRegister = mode === "register";
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
    setLoading(true);
    try {
      await apiFetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      window.location.href = nextPath;
    } catch (err) {
      setError("Identifiants invalides ou erreur serveur.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <section className="card mx-auto w-full max-w-md p-8 text-center">
        <p className="section-title">Layer</p>
        <h2 className="mt-3 text-xl font-semibold">Connexion securisee</h2>
        <p className="mt-2 text-sm text-slate-600">Verification de session...</p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-8 h-44 w-44 rounded-full bg-slate-200/60 blur-3xl" />
        <p className="section-title">Workspace</p>
        <h2 className="mt-3 text-3xl font-semibold">Pilotage des taches en equipe</h2>
        <p className="mt-3 max-w-xl text-sm text-slate-600">
          Suivi clair, priorites visibles et execution rapide. La plateforme centralise vos taches,
          sous-taches et reglages utilisateur dans une interface unique.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Temps reel</p>
            <p className="mt-2 text-lg font-semibold">Statuts fiables</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Secure</p>
            <p className="mt-2 text-lg font-semibold">Acces protege</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">PWA</p>
            <p className="mt-2 text-lg font-semibold">Mobile + desktop</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card h-fit p-8">
        <h3 className="text-2xl font-semibold">{isRegister ? "Creer un compte" : "Connexion"}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {isRegister ? "Activez votre espace de travail." : "Accedez a vos fonctionnalites."}
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
            <input
              type="email"
              required
              placeholder="vous@entreprise.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Mot de passe</span>
            <input
              type="password"
              required
              placeholder="********"
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

        <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
          {loading ? "Chargement..." : isRegister ? "Inscription" : "Connexion"}
        </button>

        <a className="mt-4 block text-center text-sm text-slate-600 underline" href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Deja inscrit ?" : "Creer un compte"}
        </a>
      </form>
    </section>
  );
}
