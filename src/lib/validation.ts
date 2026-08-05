import { z } from "zod";

const finite = z.number().finite();
const positive = finite.positive();

export const wingFormSchema = z.object({
    name: z.string().trim().min(1).max(80),
    planform: z.enum(["rectangular", "tapered"]),
    areaMode: z.enum(["calculated", "measured"]),
    span: positive,
    rootChord: positive,
    tipChord: positive,
    measuredArea: positive,
    sweepDeg: finite.min(-10).max(70),
    thicknessRatio: positive.max(0.4),
    mass: positive,
    speed: positive,
    altitude: finite.min(-1500).max(36090),
    temperature: finite.min(-100).max(140),
    environmentMode: z.enum(["standard", "manual"]),
    density: positive,
    viscosity: positive,
    gravity: positive.max(50),
    coefficientMode: z.enum(["manual", "linear"]),
    liftCoefficient: finite.min(-2).max(3),
    maxLiftCoefficient: positive.max(4),
    zeroLiftDragCoefficient: positive.max(0.5),
    oswaldEfficiency: positive.max(1.2),
    angleOfAttackDeg: finite.min(-30).max(45),
    liftCoefficientAtZero: finite.min(-1).max(2),
    liftCurveSlopePerRad: positive.max(10),
    coefficientSource: z.enum(["educational", "credible", "user"]),
  });

export type WingFormValues = z.infer<typeof wingFormSchema>;
