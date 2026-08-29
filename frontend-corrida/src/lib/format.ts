const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
});

export function formatDate(value: string, short = false) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return (short ? shortDateFormatter : dateFormatter).format(date).replace(" de ", " ");
}

export function formatDistance(value: number, maximumFractionDigits = 2) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 0,
    maximumFractionDigits,
  }).format(value)} km`;
}

export function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0 min";
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
}

export function formatPace(secondsPerKm: number | null | undefined) {
  if (!secondsPerKm || !Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return "—";
  const rounded = Math.round(secondsPerKm);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

export function durationParts(totalSeconds = 0) {
  const safe = Math.max(0, Math.round(totalSeconds));
  return {
    horas: Math.floor(safe / 3600),
    minutos: Math.floor((safe % 3600) / 60),
    segundos: safe % 60,
  };
}

export function todayCivilDate() {
  return new Date().toISOString().slice(0, 10);
}
