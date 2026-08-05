const SEA_LEVEL_PRESSURE_PA = 101_325;
const SEA_LEVEL_TEMPERATURE_K = 288.15;
const MOLAR_MASS_AIR = 0.0289644;
const UNIVERSAL_GAS_CONSTANT = 8.3144598;
const LAPSE_RATE_K_M = 0.0065;
const STANDARD_GRAVITY = 9.80665;
const SPECIFIC_GAS_CONSTANT_AIR = 287.05287;

export type AtmosphereEstimate = {
  densityKgM3: number;
  viscosityPaS: number;
  speedOfSoundMS: number;
  pressurePa: number;
};

/** Estimate low-altitude atmospheric properties using the tropospheric ISA pressure relation.
 * Temperature may be user supplied; pressure remains tied to ISA altitude. Intended below 11 km.
 */
export function estimateStandardAtmosphere(
  altitudeM: number,
  temperatureC: number,
): AtmosphereEstimate {
  if (!Number.isFinite(altitudeM) || !Number.isFinite(temperatureC)) {
    throw new Error("Altitude and temperature must be finite.");
  }
  const boundedAltitudeM = Math.min(Math.max(altitudeM, -500), 11_000);
  const temperatureK = temperatureC + 273.15;
  if (temperatureK <= 0) throw new Error("Temperature must be above absolute zero.");

  const pressurePa =
    SEA_LEVEL_PRESSURE_PA *
    Math.pow(
      1 - (LAPSE_RATE_K_M * boundedAltitudeM) / SEA_LEVEL_TEMPERATURE_K,
      (STANDARD_GRAVITY * MOLAR_MASS_AIR) /
        (UNIVERSAL_GAS_CONSTANT * LAPSE_RATE_K_M),
    );
  const densityKgM3 = pressurePa / (SPECIFIC_GAS_CONSTANT_AIR * temperatureK);

  // Sutherland's law for dry-air dynamic viscosity.
  const referenceViscosityPaS = 1.716e-5;
  const referenceTemperatureK = 273.15;
  const sutherlandConstantK = 111;
  const viscosityPaS =
    referenceViscosityPaS *
    Math.pow(temperatureK / referenceTemperatureK, 1.5) *
    ((referenceTemperatureK + sutherlandConstantK) /
      (temperatureK + sutherlandConstantK));
  const speedOfSoundMS = Math.sqrt(1.4 * SPECIFIC_GAS_CONSTANT_AIR * temperatureK);

  return { densityKgM3, viscosityPaS, speedOfSoundMS, pressurePa };
}

