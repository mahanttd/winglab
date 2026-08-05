import {
  dragN,
  inducedDragCoefficient,
  liftN,
  requiredLiftCoefficient,
} from "./aerodynamics";
import type { WingAnalysis, WingInputSI } from "@/types/wing";

export type SpeedPoint = {
  speedMS: number;
  liftN: number;
  dragN: number;
  requiredCL: number;
  liftToDrag: number;
  belowStall: boolean;
};

export function createSpeedSeries(
  input: WingInputSI,
  analysis: WingAnalysis,
  samples = 30,
): SpeedPoint[] {
  const minSpeed = Math.max(1, analysis.performance.stallSpeedMS * 0.55);
  const maxSpeed = Math.max(
    input.speedMS * 1.8,
    analysis.performance.stallSpeedMS * 2.25,
  );
  return Array.from({ length: samples }, (_, index) => {
    const speedMS = minSpeed + ((maxSpeed - minSpeed) * index) / (samples - 1);
    const constantCLLiftN = liftN(
      analysis.environment.airDensityKgM3,
      speedMS,
      analysis.geometry.wingAreaM2,
      analysis.coefficients.effectiveLiftCoefficient,
    );
    const requiredCL = requiredLiftCoefficient(
      analysis.performance.weightN,
      analysis.environment.airDensityKgM3,
      speedMS,
      analysis.geometry.wingAreaM2,
    );
    const inducedCD = inducedDragCoefficient(
      requiredCL,
      input.oswaldEfficiency,
      analysis.geometry.aspectRatio,
    );
    const levelFlightDragN = dragN(
      analysis.environment.airDensityKgM3,
      speedMS,
      analysis.geometry.wingAreaM2,
      input.zeroLiftDragCoefficient + inducedCD,
    );
    return {
      speedMS,
      liftN: constantCLLiftN,
      dragN: levelFlightDragN,
      requiredCL,
      liftToDrag: analysis.performance.weightN / levelFlightDragN,
      belowStall: speedMS < analysis.performance.stallSpeedMS,
    };
  });
}

