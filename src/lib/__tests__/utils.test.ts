import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatDistance, formatDuration, formatPace, formatDate } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates tailwind classes", () => {
    expect(cn("px-4 py-2", "px-8")).toBe("py-2 px-8");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDistance", () => {
  it("formats meters when under 1000", () => {
    expect(formatDistance(0)).toBe("0m");
    expect(formatDistance(100)).toBe("100m");
    expect(formatDistance(999)).toBe("999m");
  });

  it("rounds meters", () => {
    expect(formatDistance(123.4)).toBe("123m");
    expect(formatDistance(999.6)).toBe("1000m");
  });

  it("formats kilometers when 1000 or more", () => {
    expect(formatDistance(1000)).toBe("1.00km");
    expect(formatDistance(5500)).toBe("5.50km");
    expect(formatDistance(21097)).toBe("21.10km");
  });

  it("formats kilometers with decimal precision", () => {
    expect(formatDistance(1234)).toBe("1.23km");
  });
});

describe("formatDuration", () => {
  it("formats seconds only", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(45)).toBe("0:45");
    expect(formatDuration(59)).toBe("0:59");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(formatDuration(7200)).toBe("2:00:00");
  });

  it("pads single digit values", () => {
    expect(formatDuration(61)).toBe("1:01");
    expect(formatDuration(3601)).toBe("1:00:01");
  });
});

describe("formatPace", () => {
  it("returns 0:00 for zero", () => {
    expect(formatPace(0)).toBe("0:00");
  });

  it("formats normal pace", () => {
    expect(formatPace(300)).toBe("5:00");
    expect(formatPace(270)).toBe("4:30");
    expect(formatPace(330)).toBe("5:30");
  });

  it("formats fast pace (sub 4 min)", () => {
    expect(formatPace(210)).toBe("3:30");
    expect(formatPace(180)).toBe("3:00");
  });

  it("formats slow pace", () => {
    expect(formatPace(600)).toBe("10:00");
    expect(formatPace(720)).toBe("12:00");
  });

  it("pads seconds", () => {
    expect(formatPace(301)).toBe("5:01");
    expect(formatPace(309)).toBe("5:09");
  });
});

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-08-27T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Ahora mismo' for less than 1 minute ago", () => {
    expect(formatDate(new Date("2025-08-27T11:59:30"))).toBe("Ahora mismo");
  });

  it("formats minutes ago", () => {
    expect(formatDate(new Date("2025-08-27T11:55:00"))).toBe("Hace 5m");
    expect(formatDate(new Date("2025-08-27T11:30:00"))).toBe("Hace 30m");
  });

  it("formats hours ago", () => {
    expect(formatDate(new Date("2025-08-27T09:00:00"))).toBe("Hace 3h");
    expect(formatDate(new Date("2025-08-27T00:00:00"))).toBe("Hace 12h");
  });

  it("formats days ago", () => {
    expect(formatDate(new Date("2025-08-25T12:00:00"))).toBe("Hace 2d");
    expect(formatDate(new Date("2025-08-21T12:00:00"))).toBe("Hace 6d");
  });

  it("formats date for older dates", () => {
    const result = formatDate(new Date("2025-08-13T12:00:00"));
    expect(result).not.toMatch(/^Hace/);
    expect(result).toContain("13");
  });

  it("accepts date strings", () => {
    expect(formatDate("2025-08-27T11:55:00")).toBe("Hace 5m");
  });
});
