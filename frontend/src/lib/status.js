export const STATUS_FR = {
  todo: "A faire",
  in_progress: "En cours",
  done: "Terminee"
};

export function getStatusLabel(status) {
  return STATUS_FR[status] || status;
}
