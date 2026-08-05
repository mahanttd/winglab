import { describe, expect, it } from "vitest";
import { estimateStandardAtmosphere } from "@/lib/atmosphere";

describe("standard atmosphere approximation", () => {
  it("returns sea-level reference values at 15°C", () => {
    const result = estimateStandardAtmosphere(0, 15);
    expect(result.densityKgM3).toBeCloseTo(1.225, 3);
    expect(result.viscosityPaS).toBeCloseTo(1.7894e-5, 8);
    expect(result.speedOfSoundMS).toBeCloseTo(340.3, 1);
  });

  it("density decreases with altitude at constant temperature", () => {
    expect(estimateStandardAtmosphere(2000, 15).densityKgM3).toBeLessThan(
      estimateStandardAtmosphere(0, 15).densityKgM3,
    );
  });

  it("rejects impossible temperatures", () => {
    expect(() => estimateStandardAtmosphere(0, -274)).toThrow();
  });
});

