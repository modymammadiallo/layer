"use client";

import { useEffect } from "react";
import { apiFetch } from "../lib/api";

function applyPreferences(preferences) {
  const root = document.documentElement;
  const theme = preferences?.theme || "system";
  const density = preferences?.density || "comfortable";
  const language = preferences?.language || "fr";

  root.dataset.theme = theme;
  root.dataset.density = density;
  root.dataset.lang = language;
  root.lang = language;

  const systemDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldDark = theme === "dark" || (theme === "system" && systemDark);

  if (shouldDark) {
    root.classList.add("theme-dark");
  } else {
    root.classList.remove("theme-dark");
  }
}

export default function ThemeSync() {
  useEffect(() => {
    apiFetch("/api/user/me")
      .then((data) => applyPreferences(data?.user?.preferences))
      .catch(() => {});
  }, []);

  return null;
}
