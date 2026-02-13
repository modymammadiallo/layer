"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import InstallPrompt from "./InstallPrompt";
import TopNav from "./TopNav";
import { apiFetch } from "../lib/api";
import { isPublicPath } from "../lib/route-access";

function SessionLoader({ text }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 sm:px-8">
      <div className="card w-full max-w-md p-8 text-center fade-up">
        <p className="section-title">Layer</p>
        <h2 className="mt-3 text-xl font-semibold">Verification de session</h2>
        <p className="mt-2 text-sm text-slate-600">{text}</p>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  const isPublic = useMemo(() => isPublicPath(pathname), [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      if (isPublic) {
        if (!cancelled) {
          setSessionUser(null);
          setAuthenticated(false);
          setReady(true);
        }
        return;
      }

      try {
        const data = await apiFetch("/api/auth/me");
        if (!cancelled) {
          const loggedIn = Boolean(data?.user);
          const user = data?.user || null;
          setSessionUser(user);
          setAuthenticated(loggedIn);
          setReady(true);

          if (!loggedIn) {
            const next = encodeURIComponent(pathname || "/dashboard");
            window.location.href = `/login?next=${next}`;
            return;
          }

          if (pathname?.startsWith("/admin") && user?.role !== "admin") {
            window.location.href = "/dashboard";
          }
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null);
          setAuthenticated(false);
          setReady(true);
          const next = encodeURIComponent(pathname || "/dashboard");
          window.location.href = `/login?next=${next}`;
        }
      }
    }

    setReady(false);
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [isPublic, pathname]);

  if (!ready) {
    return <SessionLoader text="Chargement en cours..." />;
  }

  if (!isPublic && !authenticated) {
    return <SessionLoader text="Redirection vers la connexion..." />;
  }

  if (pathname?.startsWith("/admin") && sessionUser?.role !== "admin") {
    return <SessionLoader text="Verification des droits admin..." />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between fade-up">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200/70 bg-white sm:h-20 sm:w-20 hover-lift">
            <img src="/icons/icon-192.png" alt="Layer logo" className="h-11 w-11 sm:h-14 sm:w-14" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Layer</p>
              {sessionUser?.role === "admin" ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Admin
                </span>
              ) : null}
            </div>
            <h1 className="text-xl font-semibold text-ink sm:text-2xl lg:text-3xl">
              Task management pro, simple et rapide.
            </h1>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <InstallPrompt />
        </div>
      </header>

      {!isPublic ? <TopNav isAdmin={sessionUser?.role === "admin"} /> : null}

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8 fade-up-delay">{children}</main>
    </div>
  );
}
