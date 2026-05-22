export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatTime(value) {
  if (!value) return "—";
  const [hour, minute] = String(value).split(":");
  if (!hour || !minute) return value;
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function attendanceDuration(joinedAt, leftAt) {
  if (!joinedAt || !leftAt) return "—";
  const start = new Date(joinedAt).getTime();
  const end = new Date(leftAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "—";
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${rest}m`;
}
