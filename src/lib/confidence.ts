import type { WingInputSI } from "@/types/wing";

export type Confidence = {
  level: "High" | "Medium" | "Low";
  reason: string;
};

export function confidenceFor(
  metric: "geometry" | "reynolds" | "lift" | "stall" | "drag" | "glide",
  input: WingInputSI,
): Confidence {
  if (metric === "geometry") {
    return { level: "High", reason: "Directly calculated from defined geometry and units." };
  }
  if (metric === "reynolds") {
    return input.environmentMode === "manual"
      ? { level: "Medium", reason: "Depends on the entered density and viscosity." }
      : { level: "Medium", reason: "Atmospheric properties are approximated from altitude and temperature." };
  }
  if (metric === "lift") {
    return input.coefficientSource === "credible"
      ? { level: "Medium", reason: "CL is user supplied from a stated credible source." }
      : { level: "Low", reason: "CL is an educational or unverified input." };
  }
  if (metric === "stall") {
    return input.coefficientSource === "credible"
      ? { level: "Medium", reason: "The estimate is dominated by the supplied CLmax." }
      : { level: "Low", reason: "Generic CLmax is the main uncertainty." };
  }
  return {
    level: "Low",
    reason:
      metric === "drag"
        ? "CD0 and the parabolic drag polar omit several full-aircraft effects."
        : "Idealized glide excludes wind, trim, propeller, and piloting effects.",
  };
}

