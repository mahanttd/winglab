import { estimateStandardAtmosphere } from "./atmosphere";
import type { WingAnalysis, WingInputSI } from "@/types/wing";

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number.`);
  }
  return value;
}

/** Rectangular planform area, S = b × c. Inputs in m; result in m². */
export function rectangularWingArea(spanM: number, chordM: number): number {
  return positive(spanM, "Wingspan") * positive(chordM, "Chord");
}

/** Trapezoidal planform area, S = b × (cr + ct) / 2. Inputs in m; result in m². */
export function taperedWingArea(
  spanM: number,
  rootChordM: number,
  tipChordM: number,
): number {
  return (
    positive(spanM, "Wingspan") *
    (positive(rootChordM, "Root chord") + positive(tipChordM, "Tip chord")) /
    2
  );
}

/** Trapezoidal-wing mean aerodynamic chord in m. */
export function meanAerodynamicChord(
  rootChordM: number,
  tipChordM: number,
): number {
  const root = positive(rootChordM, "Root chord");
  const taperRatio = positive(tipChordM, "Tip chord") / root;
  return (
    (2 / 3) *
    root *
    ((1 + taperRatio + taperRatio ** 2) / (1 + taperRatio))
  );
}

/** Aspect ratio, AR = b² / S. Dimensionless. */
export function aspectRatio(spanM: number, areaM2: number): number {
  return positive(spanM, "Wingspan") ** 2 / positive(areaM2, "Wing area");
}

/** Weight, W = m × g. Returns N. */
export function weightN(massKg: number, gravityMS2: number): number {
  return positive(massKg, "Mass") * positive(gravityMS2, "Gravity");
}

/** Dynamic pressure, q = ½ρV². Returns Pa. */
export function dynamicPressurePa(densityKgM3: number, speedMS: number): number {
  return 0.5 * positive(densityKgM3, "Air density") * positive(speedMS, "Airspeed") ** 2;
}

/** Reynolds number, Re = ρVc/μ. Dimensionless. */
export function reynoldsNumber(
  densityKgM3: number,
  speedMS: number,
  chordM: number,
  viscosityPaS: number,
): number {
  return (
    (positive(densityKgM3, "Air density") *
      positive(speedMS, "Airspeed") *
      positive(chordM, "Reference chord")) /
    positive(viscosityPaS, "Dynamic viscosity")
  );
}

/** Lift, L = qSCL. Returns N. CL is assumed supplied or separately modeled. */
export function liftN(
  densityKgM3: number,
  speedMS: number,
  areaM2: number,
  liftCoefficient: number,
): number {
  if (!Number.isFinite(liftCoefficient)) throw new Error("CL must be finite.");
  return dynamicPressurePa(densityKgM3, speedMS) * positive(areaM2, "Wing area") * liftCoefficient;
}

/** Required CL for one-g steady level flight, CL = W/(qS). */
export function requiredLiftCoefficient(
  weightNewtons: number,
  densityKgM3: number,
  speedMS: number,
  areaM2: number,
): number {
  return (
    positive(weightNewtons, "Weight") /
    (dynamicPressurePa(densityKgM3, speedMS) * positive(areaM2, "Wing area"))
  );
}

/** Estimated one-g steady-flight stall speed in m/s. */
export function stallSpeedMS(
  weightNewtons: number,
  densityKgM3: number,
  areaM2: number,
  maxLiftCoefficient: number,
): number {
  return Math.sqrt(
    (2 * positive(weightNewtons, "Weight")) /
      (positive(densityKgM3, "Air density") *
        positive(areaM2, "Wing area") *
        positive(maxLiftCoefficient, "CLmax")),
  );
}

/** Simplified induced-drag coefficient, CDi = CL²/(πeAR). */
export function inducedDragCoefficient(
  liftCoefficient: number,
  oswaldEfficiency: number,
  wingAspectRatio: number,
): number {
  if (!Number.isFinite(liftCoefficient)) throw new Error("CL must be finite.");
  return (
    liftCoefficient ** 2 /
    (Math.PI *
      positive(oswaldEfficiency, "Oswald efficiency") *
      positive(wingAspectRatio, "Aspect ratio"))
  );
}

/** Drag, D = qSCD. Returns N. */
export function dragN(
  densityKgM3: number,
  speedMS: number,
  areaM2: number,
  dragCoefficient: number,
): number {
  return (
    dynamicPressurePa(densityKgM3, speedMS) *
    positive(areaM2, "Wing area") *
    positive(dragCoefficient, "Drag coefficient")
  );
}

/** Complete preliminary wing analysis. All inputs and calculations use SI units. */
export function analyzeWing(input: WingInputSI): WingAnalysis {
  const calculatedAreaM2 =
    input.planform === "rectangular"
      ? rectangularWingArea(input.spanM, input.rootChordM)
      : taperedWingArea(input.spanM, input.rootChordM, input.tipChordM);
  const wingAreaM2 =
    input.areaMode === "measured"
      ? positive(input.measuredAreaM2, "Measured wing area")
      : calculatedAreaM2;
  const macM =
    input.planform === "rectangular"
      ? positive(input.rootChordM, "Chord")
      : meanAerodynamicChord(input.rootChordM, input.tipChordM);
  const wingAspectRatio = aspectRatio(input.spanM, wingAreaM2);
  const atmosphere = estimateStandardAtmosphere(input.altitudeM, input.temperatureC);
  const densityKgM3 =
    input.environmentMode === "standard"
      ? atmosphere.densityKgM3
      : positive(input.densityKgM3, "Air density");
  const viscosityPaS =
    input.environmentMode === "standard"
      ? atmosphere.viscosityPaS
      : positive(input.viscosityPaS, "Dynamic viscosity");

  let effectiveLiftCoefficient = input.liftCoefficient;
  let linearModelCapped = false;
  if (input.coefficientMode === "linear") {
    const linearCL =
      input.liftCoefficientAtZero +
      input.liftCurveSlopePerRad * ((input.angleOfAttackDeg * Math.PI) / 180);
    effectiveLiftCoefficient = Math.min(linearCL, input.maxLiftCoefficient);
    linearModelCapped = linearCL >= input.maxLiftCoefficient;
  }
  if (!Number.isFinite(effectiveLiftCoefficient)) throw new Error("CL must be finite.");

  const aircraftWeightN = weightN(input.massKg, input.gravityMS2);
  const qPa = dynamicPressurePa(densityKgM3, input.speedMS);
  const liftForceN = liftN(densityKgM3, input.speedMS, wingAreaM2, effectiveLiftCoefficient);
  const requiredCL = requiredLiftCoefficient(
    aircraftWeightN,
    densityKgM3,
    input.speedMS,
    wingAreaM2,
  );
  const estimatedStallSpeedMS = stallSpeedMS(
    aircraftWeightN,
    densityKgM3,
    wingAreaM2,
    input.maxLiftCoefficient,
  );
  const inducedCD = inducedDragCoefficient(
    effectiveLiftCoefficient,
    input.oswaldEfficiency,
    wingAspectRatio,
  );
  const totalCD = positive(input.zeroLiftDragCoefficient, "CD0") + inducedCD;
  const dragForceN = dragN(densityKgM3, input.speedMS, wingAreaM2, totalCD);
  const coefficientRatio = effectiveLiftCoefficient / totalCD;
  const forceRatio = liftForceN / dragForceN;
  const speedOfSoundMS = atmosphere.speedOfSoundMS;
  const machNumber = input.speedMS / speedOfSoundMS;
  const nearStall =
    input.speedMS <= estimatedStallSpeedMS * 1.1 &&
    input.speedMS >= estimatedStallSpeedMS;
  const insufficientLift = requiredCL >= input.maxLiftCoefficient || liftForceN < aircraftWeightN;
  const warnings = [
    "Drag uses a simplified parabolic polar: CD = CD0 + CL²/(πeAR).",
  ];
  if (input.environmentMode === "standard") {
    warnings.push("Density and viscosity use a low-altitude standard-atmosphere approximation.");
  }
  if (machNumber > 0.3) {
    warnings.push(
      "Compressibility effects may be meaningful; this model is intended for low-speed subsonic analysis.",
    );
  }
  if (linearModelCapped) {
    warnings.push("The linear lift model is no longer valid near or beyond stall.");
  }
  if (input.areaMode === "measured" && Math.abs(wingAreaM2 - calculatedAreaM2) / calculatedAreaM2 > 0.05) {
    warnings.push("Measured and dimension-derived wing areas differ by more than 5%.");
  }
  const re = reynoldsNumber(densityKgM3, input.speedMS, macM, viscosityPaS);
  if (re < 40_000 || re > 5_000_000) {
    warnings.push("Reynolds number is outside WingLab's broad educational preset range.");
  }

  const output: WingAnalysis = {
    geometry: {
      calculatedAreaM2,
      wingAreaM2,
      areaDifferenceM2: wingAreaM2 - calculatedAreaM2,
      aspectRatio: wingAspectRatio,
      taperRatio: input.planform === "rectangular" ? 1 : input.tipChordM / input.rootChordM,
      meanAerodynamicChordM: macM,
    },
    environment: {
      airDensityKgM3: densityKgM3,
      dynamicViscosityPaS: viscosityPaS,
      machNumber,
      speedOfSoundMS,
      atmosphereApproximation: input.environmentMode === "standard",
    },
    coefficients: {
      effectiveLiftCoefficient,
      inducedDragCoefficient: inducedCD,
      totalDragCoefficient: totalCD,
      linearModelCapped,
    },
    performance: {
      weightN: aircraftWeightN,
      wingLoadingKgM2: input.massKg / wingAreaM2,
      wingLoadingNM2: aircraftWeightN / wingAreaM2,
      reynoldsNumber: re,
      dynamicPressurePa: qPa,
      liftN: liftForceN,
      dragN: dragForceN,
      stallSpeedMS: estimatedStallSpeedMS,
      liftToDragRatio: coefficientRatio,
      liftToDragForceRatio: forceRatio,
      requiredLiftCoefficient: requiredCL,
      glideAngleDegrees: (Math.atan(dragForceN / liftForceN) * 180) / Math.PI,
    },
    status: {
      liftMargin: liftForceN / aircraftWeightN,
      nearStall,
      insufficientLift,
      modelWarnings: warnings,
    },
  };
  const allNumbers = JSON.stringify(output).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? [];
  if (allNumbers.some((value) => !Number.isFinite(Number(value)))) {
    throw new Error("Analysis produced a non-finite result.");
  }
  return output;
}

