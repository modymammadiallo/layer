export const STATUS_FR = {
  todo: "A faire",
  in_progress: "En cours",
  done: "Terminee"
};

export const STATUS_EN = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done"
};

export function getStatusLabel(status, lang) {
  const resolved = lang || (typeof document === "undefined" ? "fr" : document.documentElement.dataset.lang || "fr");
  const map = resolved === "en" ? STATUS_EN : STATUS_FR;
  return map[status] || status;
}
