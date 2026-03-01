import { describe, it, expect } from "vitest";
import { haversineKm } from "../alertMatcher";

describe("haversineKm", () => {
  it("calculates London to Paris distance (~340 km)", () => {
    // London: 51.5074, -0.1278 | Paris: 48.8566, 2.3522
    const dist = haversineKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(350);
  });

  it("calculates zero distance for same point", () => {
    const dist = haversineKm(32.0853, 34.7818, 32.0853, 34.7818);
    expect(dist).toBe(0);
  });

  it("calculates short distance between adjacent cities (~60 km Tel Aviv to Jerusalem)", () => {
    // Tel Aviv: 32.0853, 34.7818 | Jerusalem: 31.7683, 35.2137
    const dist = haversineKm(32.0853, 34.7818, 31.7683, 35.2137);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(70);
  });

  it("calculates Beirut to Tel Aviv distance (~200 km)", () => {
    // Beirut: 33.8938, 35.5018 | Tel Aviv: 32.0853, 34.7818
    const dist = haversineKm(33.8938, 35.5018, 32.0853, 34.7818);
    expect(dist).toBeGreaterThan(190);
    expect(dist).toBeLessThan(220);
  });

  it("calculates Tehran to Tel Aviv distance (~1600 km)", () => {
    // Tehran: 35.6892, 51.3890 | Tel Aviv: 32.0853, 34.7818
    const dist = haversineKm(35.6892, 51.3890, 32.0853, 34.7818);
    expect(dist).toBeGreaterThan(1500);
    expect(dist).toBeLessThan(1700);
  });

  it("is symmetric (A to B == B to A)", () => {
    const ab = haversineKm(51.5074, -0.1278, 48.8566, 2.3522);
    const ba = haversineKm(48.8566, 2.3522, 51.5074, -0.1278);
    expect(Math.abs(ab - ba)).toBeLessThan(0.001);
  });
});
