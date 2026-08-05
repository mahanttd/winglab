export type UnitSystem = "si" | "imperial";
export type PlanformType = "rectangular" | "tapered";
export type AreaMode = "calculated" | "measured";
export type EnvironmentMode = "standard" | "manual";
export type CoefficientMode = "manual" | "linear";

export type WingInputSI = {
  name: string;
  planform: PlanformType;
  areaMode: AreaMode;
  spanM: number;
  rootChordM: number;
  tipChordM: number;
  measuredAreaM2: number;
  sweepDeg: number;
  thicknessRatio: number;
  massKg: number;
  speedMS: number;
  altitudeM: number;
  temperatureC: number;
  environmentMode: EnvironmentMode;
  densityKgM3: number;
  viscosityPaS: number;
  gravityMS2: number;
  coefficientMode: CoefficientMode;
  liftCoefficient: number;
  maxLiftCoefficient: number;
  zeroLiftDragCoefficient: number;
  oswaldEfficiency: number;
  angleOfAttackDeg: number;
  liftCoefficientAtZero: number;
  liftCurveSlopePerRad: number;
  coefficientSource: "educational" | "credible" | "user";
};

export type WingAnalysis = {
  geometry: {
    calculatedAreaM2: number;
    wingAreaM2: number;
    areaDifferenceM2: number;
    aspectRatio: number;
    taperRatio: number;
    meanAerodynamicChordM: number;
  };
  environment: {
    airDensityKgM3: number;
    dynamicViscosityPaS: number;
    machNumber: number;
    speedOfSoundMS: number;
    atmosphereApproximation: boolean;
  };
  coefficients: {
    effectiveLiftCoefficient: number;
    inducedDragCoefficient: number;
    totalDragCoefficient: number;
    linearModelCapped: boolean;
  };
  performance: {
    weightN: number;
    wingLoadingKgM2: number;
    wingLoadingNM2: number;
    reynoldsNumber: number;
    dynamicPressurePa: number;
    liftN: number;
    dragN: number;
    stallSpeedMS: number;
    liftToDragRatio: number;
    liftToDragForceRatio: number;
    requiredLiftCoefficient: number;
    glideAngleDegrees: number;
  };
  status: {
    liftMargin: number;
    nearStall: boolean;
    insufficientLift: boolean;
    modelWarnings: string[];
  };
};

export type SavedDesign = {
  id: string;
  name: string;
  savedAt: string;
  input: WingInputSI;
  analysis: WingAnalysis;
};

