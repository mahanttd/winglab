import { describe, expect, it } from "vitest";
import {
  ft2ToM2,
  ftToM,
  kgM3ToLbmFt3,
  kgToLbm,
  lbmFt3ToKgM3,
  lbmToKg,
  m2ToFt2,
  mToFt,
  mphToMS,
  msToMph,
  nToLbf,
  lbfToN,
} from "@/lib/units";

describe("unit conversions", () => {
  it("converts exact reference values", () => {
    expect(ftToM(1)).toBe(0.3048);
    expect(lbmToKg(1)).toBe(0.45359237);
    expect(mphToMS(1)).toBe(0.44704);
  });

  it("round-trips length, area, mass, speed, force, and density", () => {
    expect(ftToM(mToFt(2.4))).toBeCloseTo(2.4, 12);
    expect(ft2ToM2(m2ToFt2(0.24))).toBeCloseTo(0.24, 12);
    expect(lbmToKg(kgToLbm(1.35))).toBeCloseTo(1.35, 12);
    expect(mphToMS(msToMph(14))).toBeCloseTo(14, 12);
    expect(lbfToN(nToLbf(18))).toBeCloseTo(18, 12);
    expect(lbmFt3ToKgM3(kgM3ToLbmFt3(1.225))).toBeCloseTo(1.225, 12);
  });

  it("rejects non-finite conversions", () => {
    expect(() => mToFt(Number.NaN)).toThrow();
    expect(() => kgToLbm(Number.POSITIVE_INFINITY)).toThrow();
  });
});

