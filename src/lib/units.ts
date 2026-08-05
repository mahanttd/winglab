const M_PER_FT = 0.3048;
const KG_PER_LBM = 0.45359237;
const MPS_PER_MPH = 0.44704;
const MPS_PER_KNOT = 0.5144444444;
const N_PER_LBF = 4.4482216153;

function requireFinite(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Unit conversion requires a finite value.");
  return value;
}

export const ftToM = (value: number) => requireFinite(value) * M_PER_FT;
export const mToFt = (value: number) => requireFinite(value) / M_PER_FT;
export const ft2ToM2 = (value: number) => requireFinite(value) * M_PER_FT ** 2;
export const m2ToFt2 = (value: number) => requireFinite(value) / M_PER_FT ** 2;
export const lbmToKg = (value: number) => requireFinite(value) * KG_PER_LBM;
export const kgToLbm = (value: number) => requireFinite(value) / KG_PER_LBM;
export const mphToMS = (value: number) => requireFinite(value) * MPS_PER_MPH;
export const msToMph = (value: number) => requireFinite(value) / MPS_PER_MPH;
export const knotsToMS = (value: number) => requireFinite(value) * MPS_PER_KNOT;
export const msToKnots = (value: number) => requireFinite(value) / MPS_PER_KNOT;
export const lbfToN = (value: number) => requireFinite(value) * N_PER_LBF;
export const nToLbf = (value: number) => requireFinite(value) / N_PER_LBF;
export const lbmFt3ToKgM3 = (value: number) => requireFinite(value) / 0.0624279606;
export const kgM3ToLbmFt3 = (value: number) => requireFinite(value) * 0.0624279606;
export const lbmFtSToPaS = (value: number) => requireFinite(value) / 0.671968975;
export const paSToLbmFtS = (value: number) => requireFinite(value) * 0.671968975;
export const cToF = (value: number) => (requireFinite(value) * 9) / 5 + 32;
export const fToC = (value: number) => ((requireFinite(value) - 32) * 5) / 9;
export const kgM2ToLbmFt2 = (value: number) => requireFinite(value) * 0.204816144;
export const nM2ToLbfFt2 = (value: number) => requireFinite(value) * 0.0208854342;

