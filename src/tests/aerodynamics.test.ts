import { describe, expect, it } from "vitest";
import {
  analyzeWing,
  aspectRatio,
  dragN,
  dynamicPressurePa,
  inducedDragCoefficient,
  liftN,
  meanAerodynamicChord,
  rectangularWingArea,
  requiredLiftCoefficient,
  reynoldsNumber,
  stallSpeedMS,
  taperedWingArea,
  weightN,
} from "@/lib/aerodynamics";
import type { WingInputSI } from "@/types/wing";

const benchmark: WingInputSI = {
  name: "Benchmark",
  planform: "rectangular",
  areaMode: "measured",
  spanM: 1.2,
  rootChordM: 0.2,
  tipChordM: 0.2,
  measuredAreaM2: 0.24,
  sweepDeg: 0,
  thicknessRatio: 0.12,
  massKg: 1,
  speedMS: 10,
  altitudeM: 0,
  temperatureC: 15,
  environmentMode: "manual",
  densityKgM3: 1.225,
  viscosityPaS: 1.7894e-5,
  gravityMS2: 9.80665,
  coefficientMode: "manual",
  liftCoefficient: 0.6,
  maxLiftCoefficient: 1.2,
  zeroLiftDragCoefficient: 0.025,
  oswaldEfficiency: 0.8,
  angleOfAttackDeg: 4,
  liftCoefficientAtZero: 0.2,
  liftCurveSlopePerRad: 5.7,
  coefficientSource: "credible",
};

describe("aerodynamic primitives", () => {
  it("calculates weight", () => expect(weightN(1, 9.80665)).toBeCloseTo(9.80665, 12));
  it("calculates rectangular area", () => expect(rectangularWingArea(1.2, 0.2)).toBeCloseTo(0.24, 12));
  it("calculates tapered area", () => expect(taperedWingArea(1.2, 0.25, 0.15)).toBeCloseTo(0.24, 12));
  it("calculates aspect ratio", () => expect(aspectRatio(1.2, 0.24)).toBeCloseTo(6, 12));
  it("calculates tapered MAC", () => {
    const expected = (2 / 3) * 0.25 * ((1 + 0.6 + 0.6 ** 2) / (1 + 0.6));
    expect(meanAerodynamicChord(0.25, 0.15)).toBeCloseTo(expected, 12);
  });
  it("calculates dynamic pressure", () => expect(dynamicPressurePa(1.225, 10)).toBeCloseTo(61.25, 12));
  it("calculates Reynolds number", () => {
    expect(reynoldsNumber(1.225, 10, 0.2, 1.7894e-5)).toBeCloseTo(136917.4025, 3);
  });
  it("calculates lift", () => expect(liftN(1.225, 10, 0.24, 0.6)).toBeCloseTo(8.82, 12));
  it("calculates required CL", () => {
    expect(requiredLiftCoefficient(9.80665, 1.225, 10, 0.24)).toBeCloseTo(0.6671190476, 10);
  });
  it("calculates stall speed", () => {
    const expected = Math.sqrt((2 * 9.80665) / (1.225 * 0.24 * 1.2));
    expect(stallSpeedMS(9.80665, 1.225, 0.24, 1.2)).toBeCloseTo(expected, 12);
  });
  it("calculates induced and total drag consistently", () => {
    const cdi = inducedDragCoefficient(0.6, 0.8, 6);
    const expectedCdi = 0.6 ** 2 / (Math.PI * 0.8 * 6);
    expect(cdi).toBeCloseTo(expectedCdi, 12);
    expect(dragN(1.225, 10, 0.24, 0.025 + cdi)).toBeCloseTo(
      61.25 * 0.24 * (0.025 + expectedCdi),
      12,
    );
  });
});

describe("complete benchmark", () => {
  const result = analyzeWing(benchmark);

  it("keeps mass and weight wing loading distinct", () => {
    expect(result.performance.wingLoadingKgM2).toBeCloseTo(1 / 0.24, 12);
    expect(result.performance.wingLoadingNM2).toBeCloseTo(9.80665 / 0.24, 12);
  });

  it("matches coefficient and force lift-to-drag ratios", () => {
    expect(result.performance.liftToDragRatio).toBeCloseTo(
      result.performance.liftToDragForceRatio,
      12,
    );
  });

  it("produces only finite numeric results", () => {
    const numericTokens = JSON.stringify(result).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? [];
    expect(numericTokens.every((token) => Number.isFinite(Number(token)))).toBe(true);
  });
});

describe("behavioral relationships", () => {
  it("doubling speed quadruples lift at constant CL", () => {
    expect(liftN(1.225, 20, 0.24, 0.6)).toBeCloseTo(4 * liftN(1.225, 10, 0.24, 0.6), 12);
  });
  it("doubling wing area doubles lift", () => {
    expect(liftN(1.225, 10, 0.48, 0.6)).toBeCloseTo(2 * liftN(1.225, 10, 0.24, 0.6), 12);
  });
  it("increasing mass increases stall speed", () => {
    expect(stallSpeedMS(19.6133, 1.225, 0.24, 1.2)).toBeGreaterThan(
      stallSpeedMS(9.80665, 1.225, 0.24, 1.2),
    );
  });
  it("increasing CLmax decreases stall speed", () => {
    expect(stallSpeedMS(9.80665, 1.225, 0.24, 1.6)).toBeLessThan(
      stallSpeedMS(9.80665, 1.225, 0.24, 1.2),
    );
  });
  it("increasing aspect ratio decreases induced drag", () => {
    expect(inducedDragCoefficient(0.6, 0.8, 10)).toBeLessThan(
      inducedDragCoefficient(0.6, 0.8, 6),
    );
  });
});

describe("invalid-input handling", () => {
  it.each([
    ["mass", { massKg: -1 }],
    ["area", { measuredAreaM2: 0 }],
    ["span", { spanM: 0 }],
    ["density", { densityKgM3: -1 }],
    ["viscosity", { viscosityPaS: 0 }],
    ["CLmax", { maxLiftCoefficient: 0 }],
    ["efficiency", { oswaldEfficiency: 0 }],
  ])("rejects invalid %s", (_label, override) => {
    expect(() => analyzeWing({ ...benchmark, ...override })).toThrow();
  });
});

