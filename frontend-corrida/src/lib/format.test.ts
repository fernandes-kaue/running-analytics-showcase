import { afterEach, describe, expect, it, vi } from "vitest";
import { durationParts, formatDate, formatDistance, formatDuration, formatPace, todayCivilDate } from "@/lib/format";

afterEach(() => vi.useRealTimers());

describe("formatação pt-BR", () => {
  it("formata data civil sem deslocar o dia", () => expect(formatDate("2026-07-21")).toContain("21 jul"));
  it("formata distância em quilômetros", () => expect(formatDistance(5.25)).toBe("5,25 km"));
  it("formata pace com segundos", () => expect(formatPace(328)).toBe("5:28 /km"));
  it("formata duração curta e longa", () => {
    expect(formatDuration(1770)).toBe("29min 30s");
    expect(formatDuration(5430)).toBe("1h 30min");
  });
  it("divide duração para o formulário", () => expect(durationParts(5432)).toEqual({ horas: 1, minutos: 30, segundos: 32 }));
  it("usa UTC como política única de data civil", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-21T23:30:00-03:00"));
    expect(todayCivilDate()).toBe("2026-07-22");
  });
});
