"use client";

import { usePathname } from "next/navigation";
import { t, useLang } from "../lib/i18n";

const BASE_LINKS = [
  { href: "/dashboard", labelKey: "nav_overview" },
  { href: "/tasks", labelKey: "nav_tasks" },
  { href: "/tasks/new", labelKey: "nav_new" }
];

export default function TopNav({ isAdmin = false }) {
  const pathname = usePathname();
  const lang = useLang();

  const links = isAdmin
    ? [...BASE_LINKS, { href: "/admin", labelKey: "nav_admin" }]
    : BASE_LINKS;

  return (
    <nav className="mx-auto w-full max-w-6xl px-4 pb-5 sm:px-8">
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`${active ? "btn-primary" : "btn-ghost"} shrink-0`}
              >
                {t(lang, link.labelKey)}
              </a>
            );
          })}
        </div>

        <a
          href="/settings"
          className={
            pathname === "/settings"
              ? "btn-primary w-full sm:w-auto"
              : "btn-ghost flex w-full items-center justify-center gap-2 sm:w-auto"
          }
          aria-label="Profil et parametres"
        >
          <span>{t(lang, "nav_profile")}</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M20 20.5c0-3.59-3.582-6.5-8-6.5s-8 2.91-8 6.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </a>
      </div>
    </nav>
  );
}
