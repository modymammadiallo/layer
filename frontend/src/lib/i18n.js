"use client";

import { useEffect, useState } from "react";

const STRINGS = {
  fr: {
    nav_overview: "Apercu",
    nav_tasks: "Taches",
    nav_new: "Nouvelle",
    nav_admin: "Admin",
    nav_profile: "Profil",
    settings_title: "Parametres",
    settings_subtitle: "Gere votre profil et vos preferences.",
    profile_title: "Profil",
    password_title: "Mot de passe",
    prefs_title: "Preferences",
    session_title: "Session",
    email_label: "Email",
    avatar_label: "Avatar",
    avatar_url: "URL de l'avatar",
    current_password: "Mot de passe actuel",
    new_password: "Nouveau mot de passe",
    confirm_password: "Confirmer le mot de passe",
    theme_label: "Theme",
    language_label: "Langue",
    notifications_label: "Notifications",
    density_label: "Densite",
    timezone_label: "Timezone",
    save: "Enregistrer",
    save_profile: "Sauvegarder",
    refresh: "Recharger",
    logout: "Deconnexion",
    delete_account: "Supprimer le compte",
    create_task: "Creer une tache",
    view_tasks: "Voir toutes les taches",
    overview_title: "Apercu",
    shortcuts: "Raccourcis",
    settings_saved: "Preferences enregistrees."
  },
  en: {
    nav_overview: "Overview",
    nav_tasks: "Tasks",
    nav_new: "New",
    nav_admin: "Admin",
    nav_profile: "Profile",
    settings_title: "Settings",
    settings_subtitle: "Manage your profile and preferences.",
    profile_title: "Profile",
    password_title: "Password",
    prefs_title: "Preferences",
    session_title: "Session",
    email_label: "Email",
    avatar_label: "Avatar",
    avatar_url: "Avatar URL",
    current_password: "Current password",
    new_password: "New password",
    confirm_password: "Confirm password",
    theme_label: "Theme",
    language_label: "Language",
    notifications_label: "Notifications",
    density_label: "Density",
    timezone_label: "Timezone",
    save: "Save",
    save_profile: "Save",
    refresh: "Reload",
    logout: "Sign out",
    delete_account: "Delete account",
    create_task: "Create task",
    view_tasks: "View all tasks",
    overview_title: "Overview",
    shortcuts: "Shortcuts",
    settings_saved: "Preferences saved."
  }
};

export function t(lang, key) {
  return STRINGS[lang]?.[key] || STRINGS.fr[key] || key;
}

export function useLang() {
  const [lang, setLang] = useState(
    typeof document === "undefined"
      ? "fr"
      : document.documentElement.dataset.lang || "fr"
  );

  useEffect(() => {
    const handler = () => {
      setLang(document.documentElement.dataset.lang || "fr");
    };
    window.addEventListener("preferences:updated", handler);
    return () => window.removeEventListener("preferences:updated", handler);
  }, []);

  return lang;
}
