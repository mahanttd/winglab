"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileJson,
  Gauge,
  Info,
  Pencil,
  Printer,
  Save,
  Trash2,
  Wind,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
} from "react-hook-form";
import { analyzeWing } from "@/lib/aerodynamics";
import { confidenceFor } from "@/lib/confidence";
import { loadDesigns, persistDesigns } from "@/lib/storage";
import {
  cToF,
  fToC,
  ft2ToM2,
  ftToM,
  kgM3ToLbmFt3,
  kgM2ToLbmFt2,
  kgToLbm,
  lbmFt3ToKgM3,
  lbmFtSToPaS,
  lbmToKg,
  m2ToFt2,
  mToFt,
  mphToMS,
  msToMph,
  nM2ToLbfFt2,
  nToLbf,
  paSToLbmFtS,
} from "@/lib/units";
import {
  wingFormSchema,
  type WingFormValues,
} from "@/lib/validation";
import type { SavedDesign, UnitSystem, WingAnalysis, WingInputSI } from "@/types/wing";
import { AnalysisCharts } from "@/components/charts/AnalysisCharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlowVisualization } from "./FlowVisualization";
import { WingVisualizer } from "./WingVisualizer";

const defaultInput: WingInputSI = {
  name: "RC trainer baseline",
  planform: "tapered",
  areaMode: "calculated",
  spanM: 1.2,
  rootChordM: 0.24,
  tipChordM: 0.16,
  measuredAreaM2: 0.24,
  sweepDeg: 2,
  thicknessRatio: 0.12,
  massKg: 1,
  speedMS: 10,
  altitudeM: 0,
  temperatureC: 15,
  environmentMode: "standard",
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
  coefficientSource: "educational",
};

const presets: Record<string, WingInputSI> = {
  trainer: defaultInput,
  glider: {
    ...defaultInput,
    name: "High-AR glider study",
    spanM: 2.4,
    rootChordM: 0.22,
    tipChordM: 0.12,
    measuredAreaM2: 0.408,
    massKg: 1.35,
    speedMS: 12,
    liftCoefficient: 0.55,
    maxLiftCoefficient: 1.25,
    zeroLiftDragCoefficient: 0.019,
    oswaldEfficiency: 0.86,
  },
  sport: {
    ...defaultInput,
    name: "Compact sport study",
    spanM: 0.9,
    rootChordM: 0.28,
    tipChordM: 0.17,
    measuredAreaM2: 0.2025,
    massKg: 1.15,
    speedMS: 17,
    sweepDeg: 8,
    liftCoefficient: 0.48,
    maxLiftCoefficient: 1.1,
    zeroLiftDragCoefficient: 0.03,
    oswaldEfficiency: 0.74,
  },
  blank: {
    ...defaultInput,
    name: "Custom design",
    planform: "rectangular",
    spanM: 1,
    rootChordM: 0.2,
    tipChordM: 0.2,
    measuredAreaM2: 0.2,
    sweepDeg: 0,
  },
};

function toForm(input: WingInputSI, units: UnitSystem): WingFormValues {
  const imperial = units === "imperial";
  const display = (value: number) => Number(value.toPrecision(7));
  return {
    name: input.name,
    planform: input.planform,
    areaMode: input.areaMode,
    span: display(imperial ? mToFt(input.spanM) : input.spanM),
    rootChord: display(imperial ? mToFt(input.rootChordM) : input.rootChordM),
    tipChord: display(imperial ? mToFt(input.tipChordM) : input.tipChordM),
    measuredArea: display(imperial ? m2ToFt2(input.measuredAreaM2) : input.measuredAreaM2),
    sweepDeg: input.sweepDeg,
    thicknessRatio: input.thicknessRatio,
    mass: display(imperial ? kgToLbm(input.massKg) : input.massKg),
    speed: display(imperial ? msToMph(input.speedMS) : input.speedMS),
    altitude: display(imperial ? mToFt(input.altitudeM) : input.altitudeM),
    temperature: display(imperial ? cToF(input.temperatureC) : input.temperatureC),
    environmentMode: input.environmentMode,
    density: display(imperial ? kgM3ToLbmFt3(input.densityKgM3) : input.densityKgM3),
    viscosity: display(imperial ? paSToLbmFtS(input.viscosityPaS) : input.viscosityPaS),
    gravity: display(imperial ? mToFt(input.gravityMS2) : input.gravityMS2),
    coefficientMode: input.coefficientMode,
    liftCoefficient: input.liftCoefficient,
    maxLiftCoefficient: input.maxLiftCoefficient,
    zeroLiftDragCoefficient: input.zeroLiftDragCoefficient,
    oswaldEfficiency: input.oswaldEfficiency,
    angleOfAttackDeg: input.angleOfAttackDeg,
    liftCoefficientAtZero: input.liftCoefficientAtZero,
    liftCurveSlopePerRad: input.liftCurveSlopePerRad,
    coefficientSource: input.coefficientSource,
  };
}

function toSI(values: WingFormValues, units: UnitSystem): WingInputSI {
  const imperial = units === "imperial";
  return {
    name: values.name,
    planform: values.planform,
    areaMode: values.areaMode,
    spanM: imperial ? ftToM(values.span) : values.span,
    rootChordM: imperial ? ftToM(values.rootChord) : values.rootChord,
    tipChordM: imperial ? ftToM(values.tipChord) : values.tipChord,
    measuredAreaM2: imperial ? ft2ToM2(values.measuredArea) : values.measuredArea,
    sweepDeg: values.sweepDeg,
    thicknessRatio: values.thicknessRatio,
    massKg: imperial ? lbmToKg(values.mass) : values.mass,
    speedMS: imperial ? mphToMS(values.speed) : values.speed,
    altitudeM: imperial ? ftToM(values.altitude) : values.altitude,
    temperatureC: imperial ? fToC(values.temperature) : values.temperature,
    environmentMode: values.environmentMode,
    densityKgM3: imperial ? lbmFt3ToKgM3(values.density) : values.density,
    viscosityPaS: imperial ? lbmFtSToPaS(values.viscosity) : values.viscosity,
    gravityMS2: imperial ? ftToM(values.gravity) : values.gravity,
    coefficientMode: values.coefficientMode,
    liftCoefficient: values.liftCoefficient,
    maxLiftCoefficient: values.maxLiftCoefficient,
    zeroLiftDragCoefficient: values.zeroLiftDragCoefficient,
    oswaldEfficiency: values.oswaldEfficiency,
    angleOfAttackDeg: values.angleOfAttackDeg,
    liftCoefficientAtZero: values.liftCoefficientAtZero,
    liftCurveSlopePerRad: values.liftCurveSlopePerRad,
    coefficientSource: values.coefficientSource,
  };
}

function Field({
  name,
  label,
  unit,
  help,
  step = "any",
  register,
  errors,
}: {
  name: FieldPath<WingFormValues>;
  label: string;
  unit?: string;
  help?: string;
  step?: string;
  register: UseFormRegister<WingFormValues>;
  errors: FieldErrors<WingFormValues>;
}) {
  const error = errors[name]?.message;
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {help && (
          <span className="help-tip" tabIndex={0} role="tooltip" aria-label={help} title={help}>
            <Info size={12} />
          </span>
        )}
      </span>
      <span className="input-shell">
        <input
          type="number"
          step={step}
          aria-invalid={Boolean(error)}
          {...register(name, { valueAsNumber: true })}
        />
        {unit && <span>{unit}</span>}
      </span>
      {error && <span className="field-error">{String(error)}</span>}
    </label>
  );
}

function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "â€”";
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: digits }).format(value);
}

function ResultCard({
  label,
  value,
  unit,
  explanation,
  confidence,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  explanation: string;
  confidence: ReturnType<typeof confidenceFor>;
  accent?: boolean;
}) {
  return (
    <article className={`result-card ${accent ? "result-accent" : ""}`}>
      <div className="result-label">{label}</div>
      <div className="result-value">
        {value} {unit && <span>{unit}</span>}
      </div>
      <p>{explanation}</p>
      <div className="result-meta">
        <Badge
          tone={confidence.level === "High" ? "green" : confidence.level === "Medium" ? "cyan" : "amber"}
        >
          {confidence.level} confidence
        </Badge>
        <span>{confidence.reason}</span>
      </div>
    </article>
  );
}

function ScientificStatus({ input, analysis }: { input: WingInputSI; analysis: WingAnalysis }) {
  const state = analysis.status.insufficientLift
    ? {
        tone: "danger",
        icon: <AlertTriangle size={20} />,
        title: "Insufficient lift under entered assumptions",
        detail: `Required CL ${analysis.performance.requiredLiftCoefficient.toFixed(2)} is ${analysis.performance.requiredLiftCoefficient >= input.maxLiftCoefficient ? "at or above" : "below"} CLmax ${input.maxLiftCoefficient.toFixed(2)}. The entered CL produces a lift margin of ${analysis.status.liftMargin.toFixed(2)}.`,
      }
    : analysis.status.nearStall
      ? {
          tone: "warning",
          icon: <AlertTriangle size={20} />,
          title: "Near estimated one-g stall speed",
          detail: `Airspeed is within 10% of the ${analysis.performance.stallSpeedMS.toFixed(2)} m/s estimate. Gusts, turns, and dynamic stall are not modeled.`,
        }
      : {
          tone: "valid",
          icon: <CheckCircle2 size={20} />,
          title: "Valid low-speed operating condition",
          detail: `Above estimated stall speed with CLrequired ${analysis.performance.requiredLiftCoefficient.toFixed(2)} below CLmax ${input.maxLiftCoefficient.toFixed(2)}. This is not a safety determination.`,
        };

  return (
    <section className={`science-status ${state.tone}`} aria-live="polite">
      <div className="status-icon">{state.icon}</div>
      <div>
        <span className="eyebrow">MODEL STATUS</span>
        <h2>{state.title}</h2>
        <p>{state.detail}</p>
      </div>
      <Badge tone={state.tone === "valid" ? "green" : state.tone === "warning" ? "amber" : "red"}>
        Mach {analysis.environment.machNumber.toFixed(3)}
      </Badge>
    </section>
  );
}

export function SimulatorClient() {
  const [units, setUnits] = useState<UnitSystem>("si");
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const {
    register,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<WingFormValues>({
    resolver: zodResolver(wingFormSchema),
    mode: "onChange",
    defaultValues: toForm(defaultInput, "si"),
  });
  const values = useWatch({ control }) as WingFormValues;
  const parsed = wingFormSchema.safeParse(values);
  const input = parsed.success ? toSI(parsed.data, units) : null;
  const analysis = useMemo(() => {
    if (!input) return null;
    try {
      return analyzeWing(input);
    } catch {
      return null;
    }
  }, [input]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSavedDesigns(loadDesigns()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const saveCurrent = useCallback(() => {
    if (!input || !analysis) {
      setSaveMessage("Resolve input errors before saving.");
      return;
    }
    const saved: SavedDesign = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      name: input.name,
      savedAt: new Date().toISOString(),
      input,
      analysis,
    };
    setSavedDesigns((current) => {
      const next = [saved, ...current].slice(0, 8);
      persistDesigns(next);
      return next;
    });
    setSaveMessage(`Saved â€œ${input.name}â€ locally.`);
    window.setTimeout(() => setSaveMessage(""), 2600);
  }, [input, analysis]);

  useEffect(() => {
    const onUnits = () => {
      const nextUnits = document.documentElement.dataset.units as UnitSystem | undefined;
      if (!nextUnits) return;
      const current = wingFormSchema.safeParse(getValues());
      if (!current.success || nextUnits === units) return;
      const currentSI = toSI(current.data, units);
      setUnits(nextUnits);
      reset(toForm(currentSI, nextUnits));
    };
    const onNew = () => {
      if (window.confirm("Start a new design and clear the current inputs?")) {
        reset(toForm(presets.blank, units));
      }
    };
    const unitObserver = new MutationObserver(onUnits);
    unitObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-units"],
    });
    onUnits();
    window.addEventListener("winglab:new", onNew);
    window.addEventListener("winglab:save", saveCurrent);
    return () => {
      unitObserver.disconnect();
      window.removeEventListener("winglab:new", onNew);
      window.removeEventListener("winglab:save", saveCurrent);
    };
  }, [getValues, reset, saveCurrent, units]);

  const applyPreset = (key: string) => reset(toForm(presets[key], units));
  const loadSaved = (design: SavedDesign) => reset(toForm(design.input, units));
  const updateDesigns = (next: SavedDesign[]) => {
    setSavedDesigns(next);
    persistDesigns(next);
  };
  const duplicate = (design: SavedDesign) => {
    updateDesigns([
      {
        ...design,
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
        name: `${design.name} copy`,
        savedAt: new Date().toISOString(),
      },
      ...savedDesigns,
    ]);
  };
  const rename = (design: SavedDesign) => {
    const nextName = window.prompt("Rename saved design", design.name)?.trim();
    if (!nextName) return;
    updateDesigns(savedDesigns.map((item) => (item.id === design.id ? { ...item, name: nextName } : item)));
  };
  const remove = (design: SavedDesign) => {
    if (window.confirm(`Delete â€œ${design.name}â€ from this browser?`)) {
      updateDesigns(savedDesigns.filter((item) => item.id !== design.id));
    }
  };
  const exportJson = () => {
    if (!input || !analysis) return;
    const blob = new Blob([JSON.stringify({ input, analysis }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "winglab-design"}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  if (!input || !analysis) {
    return (
      <main className="simulator-page">
        <section className="science-status danger">
          <AlertTriangle />
          <div>
            <span className="eyebrow">MISSING REQUIRED DATA</span>
            <h1>WingLab cannot calculate this configuration yet.</h1>
            <p>Correct the highlighted input values. Non-finite, zero, and negative physical inputs are rejected.</p>
          </div>
        </section>
        <div className="input-recovery">
          <Button variant="primary" onClick={() => reset(toForm(defaultInput, units))}>
            Restore validated example
          </Button>
          <pre>{Object.values(errors).map((error) => error?.message).filter(Boolean).join("\n")}</pre>
        </div>
      </main>
    );
  }

  const geometryConfidence = confidenceFor("geometry", input);
  const liftConfidence = confidenceFor("lift", input);
  const stallConfidence = confidenceFor("stall", input);
  const dragConfid×^¹¶‰ËkºwµçqÕ”ô‰µ•…ÍÕÉ•ˆì¸¸¹É•¥ÍÑ•È ‰…É•…5½‘”ˆ¥ô€¼ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ù5•…ÍÕÉ•…É•„ğ½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ğ½±…‰•°ø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€íÙ…±Õ•Ì¹…É•…5½‘”€ôôô€‰µ•…ÍÕÉ•ˆ€˜˜€ (€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰µ•…ÍÕÉ•‘É•„ˆ±…‰•°ô‰5•…ÍÕÉ•İ¥¹œ…É•„ˆÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰™Ó
Èˆ€è€‰·
È‰ôÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…±Õ±…Ñ•µÍÑÉ¥Àˆø(€€€€€€€€€€€€€€€€ñÍÁ…¸ù…±Õ±…Ñ•…É•„€ñÍÑÉ½¹œùí™½Éµ…Ñ9Õµ‰•È¡¥µÁ•É¥…°€ü´ÉQ½ĞÈ¡…¹…±åÍ¥Ì¹•½µ•ÑÉä¹…±Õ±…Ñ•‘É•…4È¤€è…¹…±åÍ¥Ì¹•½µ•ÑÉä¹…±Õ±…Ñ•‘É•…4È°€Ğ¥ôí¥µÁ•É¥…°€ü€‰™Ó
Èˆ€è€‰·
È‰ôğ½ÍÑÉ½¹œøğ½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñÍÁ…¸ù5€ñÍÑÉ½¹œùí™½Éµ…Ñ9Õµ‰•È¡¥µÁ•É¥…°€üµQ½Ğ¡…¹…±åÍ¥Ì¹•½µ•ÑÉä¹µ•…¹•É½‘å¹…µ¥¡½É‘4¤€è…¹…±åÍ¥Ì¹•½µ•ÑÉä¹µ•…¹•É½‘å¹…µ¥¡½É‘4°€Ğ¥ôí¥µÁ•É¥…°€ü€‰™Ğˆ€è€‰´‰ôğ½ÍÑÉ½¹œøğ½ÍÁ…¸ø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€íÙ…±Õ•Ì¹…É•…5½‘”€ôôô€‰µ•…ÍÕÉ•ˆ€˜˜€ (€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰™¥•±µ¹½Ñ”ˆù5•…ÍÕÉ•µ¥¹ÕÌ…±Õ±…Ñ•èí™½Éµ…Ñ9Õµ‰•È¡¥µÁ•É¥…°€ü´ÉQ½ĞÈ¡…¹…±åÍ¥Ì¹•½µ•ÑÉä¹…É•…¥™™•É•¹•4È¤€è…¹…±åÍ¥Ì¹•½µ•ÑÉä¹…É•…¥™™•É•¹•4È°€Ì¥ôí¥µÁ•É¥…°€ü€‰™Ó
Èˆ€è€‰·
È‰ôğ½Àø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™¥•±µÉ½Üˆø(€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰Íİ••Á•œˆ±…‰•°ô‰Mİ••À…¹±”ˆÕ¹¥Ğô‰‘•œˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰Ñ¡¥­¹•ÍÍI…Ñ¥¼ˆ±…‰•°ô‰Q¡¥­¹•ÍÌ€¼¡½Éˆ¡•±Àô‰5…á¥µÕ´…¥É™½¥°Ñ¡¥­¹•ÍÌ‘¥Ù¥‘•‰ä¡½Éì‘•ÍÉ¥ÁÑ¥Ù”¥¸Ñ¡¥Ì5Y@¸ˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€íÁ±…¹™½Éµ]…É¹¥¹œ€˜˜€ñÀ±…ÍÍ9…µ”ô‰Í½™Ğµİ…É¹¥¹œˆøñ±•ÉÑQÉ¥…¹±”Í¥é”õìÄÑô€¼øU¹ÕÍÕ…°Ñ…Á•ÈÉ…Ñ¥¼€¡í…¹…±åÍ¥Ì¹•½µ•ÑÉä¹Ñ…Á•ÉI…Ñ¥¼¹Ñ½¥á• È¥ô¤¸I•Ù¥•ÜÑ¡”•¹Ñ•É••½µ•ÑÉä¸ğ½Àùô(€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ğ½‘•Ñ…¥±Ìø((€€€€€€€€€€ñ‘•Ñ…¥±Ì½Á•¸±…ÍÍ9…µ”ô‰¥¹ÁÕĞµÍ•Ñ¥½¸ˆø(€€€€€€€€€€€€ñÍÕµµ…ÉäøñÍÁ…¸øÀÈğ½ÍÁ…¸ø¥ÉÉ…™Ğ€˜•¹Ù¥É½¹µ•¹Ğğ½ÍÕµµ…Éäø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¥¹ÁÕĞµÍ•Ñ¥½¸µ‰½‘äˆø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™¥•±µÉ½Üˆø(€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰µ…ÍÌˆ±…‰•°ô‰¥ÉÉ…™Ğµ…ÍÌˆÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰±‰´ˆ€è€‰­œ‰ôÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰ÍÁ••ˆ±…‰•°ô‰QÉÕ”…¥ÉÍÁ••ˆÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰µÁ ˆ€è€‰´½Ì‰ôÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Í•µ•¹Ñ•ˆø(€€€€€€€€€€€€€€€€ñ±…‰•°øñ¥¹ÁÕĞÑåÁ”ô‰É…‘¥¼ˆÙ…±Õ”ô‰ÍÑ…¹‘…Éˆì¸¸¹É•¥ÍÑ•È ‰•¹Ù¥É½¹µ•¹Ñ5½‘”ˆ¥ô€¼øñÍÁ…¸ùMÑ…¹‘…É…Ñµ½ÍÁ¡•É”ğ½ÍÁ…¸øğ½±…‰•°ø(€€€€€€€€€€€€€€€€ñ±…‰•°øñ¥¹ÁÕĞÑåÁ”ô‰É…‘¥¼ˆÙ…±Õ”ô‰µ…¹Õ…°ˆì¸¸¹É•¥ÍÑ•È ‰•¹Ù¥É½¹µ•¹Ñ5½‘”ˆ¥ô€¼øñÍÁ…¸ù5…¹Õ…°•¹Ù¥É½¹µ•¹Ğğ½ÍÁ…¸øğ½±…‰•°ø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€íÙ…±Õ•Ì¹•¹Ù¥É½¹µ•¹Ñ5½‘”€ôôô€‰ÍÑ…¹‘…Éˆ€ü€ (€€€€€€€€€€€€€€€€ğø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™¥•±µÉ½Üˆø(€€€€€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰…±Ñ¥ÑÕ‘”ˆ±…‰•°ô‰±Ñ¥ÑÕ‘”ˆÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰™Ğˆ€è€‰´‰ôÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰Ñ•µÁ•É…ÑÕÉ”ˆ±…‰•°ô‰¥ÈÑ•µÁ•É…ÑÕÉ”ˆÕ¹¥Ğõí¥µÁ•É¥…°€ü€‹
Áˆ€è€‹
Á‰ôÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…±Õ±…Ñ•µÍÑÉ¥Àˆø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùÍÑ¥µ…Ñ•ƒ>€ñÍÑÉ½¹œùí™½Éµ…Ñ9Õµ‰•È¡¥µÁ•É¥…°€ü­4ÍQ½1‰µĞÌ¡…¹…±åÍ¥Ì¹•¹Ù¥É½¹µ•¹Ğ¹…¥É•¹Í¥Ñå-4Ì¤€è…¹…±åÍ¥Ì¹•¹Ù¥É½¹µ•¹Ğ¹…¥É•¹Í¥Ñå-4Ì°€Ğ¥ôí¥µÁ•É¥…°€ü€‰±‰´½™Ó
Ìˆ€è€‰­œ½·
Ì‰ôğ½ÍÑÉ½¹œøğ½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùÍÑ¥µ…Ñ•ƒ:ğ€ñÍÑÉ½¹œùí…¹…±åÍ¥Ì¹•¹Ù¥É½¹µ•¹Ğ¹‘å¹…µ¥Y¥Í½Í¥ÑåA…L¹Ñ½áÁ½¹•¹Ñ¥…° Ì¥ôA‡
İÌğ½ÍÑÉ½¹œøğ½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰™¥•±µ¹½Ñ”ˆù1½Üµ…±Ñ¥ÑÕ‘”%MÁÉ•ÍÍÕÉ”É•±…Ñ¥½¸İ¥Ñ Ñ•µÁ•É…ÑÕÉ”µ…‘©ÕÍÑ•‘•¹Í¥Ñä…¹MÕÑ¡•É±…¹Ù¥Í½Í¥Ñä¸ğ½Àø(€€€€€€€€€€€€€€€€ğ¼ø(€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™¥•±µÉ½Üˆø(€€€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰‘•¹Í¥Ñäˆ±…‰•°ô‰¥È‘•¹Í¥ÑäˆÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰±‰´½™Ó
Ìˆ€è€‰­œ½·
Ì‰ôÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰Ù¥Í½Í¥Ñäˆ±…‰•°ô‰å¹…µ¥ŒÙ¥Í½Í¥ÑäˆÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰±‰´¼¡™Ó
İÌ¤ˆ€è€‰A‡
İÌ‰ôÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰É…Ù¥Ñäˆ±…‰•°ô‰É…Ù¥Ñ…Ñ¥½¹…°…•±•É…Ñ¥½¸ˆÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰™Ğ½Ï
Èˆ€è€‰´½Ï
È‰ôÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ğ½‘•Ñ…¥±Ìø((€€€€€€€€€€ñ‘•Ñ…¥±Ì½Á•¸±…ÍÍ9…µ”ô‰¥¹ÁÕĞµÍ•Ñ¥½¸ˆø(€€€€€€€€€€€€ñÍÕµµ…ÉäøñÍÁ…¸øÀÌğ½ÍÁ…¸ø•É½‘å¹…µ¥Œ½•™™¥¥•¹ÑÌğ½ÍÕµµ…Éäø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¥¹ÁÕĞµÍ•Ñ¥½¸µ‰½‘äˆø(€€€€€€€€€€€€€€ñ±…‰•°±…ÍÍ9…µ”ô‰™¥•±ˆø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™¥•±µ±…‰•°ˆù½•™™¥¥•¹ĞÁÉ•Í•Ğğ½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Í•±•ĞµÍ¡•±°ˆø(€€€€€€€€€€€€€€€€€€ñÍ•±•Ğ(€€€€€€€€€€€€€€€€€€€‘•™…Õ±ÑY…±Õ”ô‰½¹Í•ÉÙ…Ñ¥Ù”ˆ(€€€€€€€€€€€€€€€€€€€½¹¡…¹”õì¡•Ù•¹Ğ¤€ôøì(€€€€€€€€€€€€€€€€€€€€€½¹ÍĞÁÉ•Í•Ğ€ô•Ù•¹Ğ¹Ñ…É•Ğ¹Ù…±Õ”ì(€€€€€€€€€€€€€€€€€€€€€¥˜€¡ÁÉ•Í•Ğ€ôôô€‰½¹Í•ÉÙ…Ñ¥Ù”ˆ¤ì(€€€€€€€€€€€€€€€€€€€€€€€Í•ÑY…±Õ” ‰±¥™Ñ½•™™¥¥•¹Ğˆ°€À¸Ø¤ìÍ•ÑY…±Õ” ‰µ…á1¥™Ñ½•™™¥¥•¹Ğˆ°€Ä¸È¤ìÍ•ÑY…±Õ” ‰é•É½1¥™ÑÉ…½•™™¥¥•¹Ğˆ°€À¸ÀÈÔ¤ìÍ•ÑY…±Õ” ‰½Íİ…±‘™™¥¥•¹äˆ°€À¸à¤ìÍ•ÑY…±Õ” ‰½•™™¥¥•¹ÑM½ÕÉ”ˆ°€‰•‘Õ…Ñ¥½¹…°ˆ¤ì(€€€€€€€€€€€€€€€€€€€€€ô•±Í”¥˜€¡ÁÉ•Í•Ğ€ôôô€‰…µ‰•É•ˆ¤ì(€€€€€€€€€€€€€€€€€€€€€€€Í•ÑY…±Õ” ‰±¥™Ñ½•™™¥¥•¹Ğˆ°€À¸ÜÈ¤ìÍ•ÑY…±Õ” ‰µ…á1¥™Ñ½•™™¥¥•¹Ğˆ°€Ä¸Ğ¤ìÍ•ÑY…±Õ” ‰é•É½1¥™ÑÉ…½•™™¥¥•¹Ğˆ°€À¸ÀÌ¤ìÍ•ÑY…±Õ” ‰½Íİ…±‘™™¥¥•¹äˆ°€À¸Üà¤ìÍ•ÑY…±Õ” ‰½•™™¥¥•¹ÑM½ÕÉ”ˆ°€‰•‘Õ…Ñ¥½¹…°ˆ¤ì(€€€€€€€€€€€€€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€€€€€€€€€€€€€Í•ÑY…±Õ” ‰½•™™¥¥•¹ÑM½ÕÉ”ˆ°€‰ÕÍ•Èˆ¤ì(€€€€€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€ñ½ÁÑ¥½¸Ù…±Õ”ô‰½¹Í•ÉÙ…Ñ¥Ù”ˆù½¹Í•ÉÙ…Ñ¥Ù”ÑÉ…¥¹¥¹œ•á…µÁ±”ğ½½ÁÑ¥½¸ø(€€€€€€€€€€€€€€€€€€€€ñ½ÁÑ¥½¸Ù…±Õ”ô‰…µ‰•É•ˆù5½‘•É…Ñ”…µ‰•É•µİ¥¹œ•á…µÁ±”ğ½½ÁÑ¥½¸ø(€€€€€€€€€€€€€€€€€€€€ñ½ÁÑ¥½¸Ù…±Õ”ô‰ÕÍÑ½´ˆùUÍ•Èµ‘•™¥¹•ğ½½ÁÑ¥½¸ø(€€€€€€€€€€€€€€€€€€ğ½Í•±•Ğø(€€€€€€€€€€€€€€€€ğ½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™¥•±µ¹½Ñ”ˆù‘Õ…Ñ¥½¹…°ÍÑ…ÉÑ¥¹œÁ½¥¹ÑÏŠQ¹½ĞÙ•É¥™¥•Ù…±Õ•Ì™½È…¸…¥ÉÉ…™Ğ¸ğ½ÍÁ…¸ø(€€€€€€€€€€€€€€ğ½±…‰•°ø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Í•µ•¹Ñ•ˆø(€€€€€€€€€€€€€€€€ñ±…‰•°øñ¥¹ÁÕĞÑåÁ”ô‰É…‘¥¼ˆÙ…±Õ”ô‰µ…¹Õ…°ˆì¸¸¹É•¥ÍÑ•È ‰½•™™¥¥•¹Ñ5½‘”ˆ¥ô€¼øñÍÁ…¸ù5…¹Õ…°0ğ½ÍÁ…¸øğ½±…‰•°ø(€€€€€€€€€€€€€€€€ñ±…‰•°øñ¥¹ÁÕĞÑåÁ”ô‰É…‘¥¼ˆÙ…±Õ”ô‰±¥¹•…Èˆì¸¸¹É•¥ÍÑ•È ‰½•™™¥¥•¹Ñ5½‘”ˆ¥ô€¼øñÍÁ…¸ù‘Õ…Ñ¥½¹…°±¥¹•…Èµ½‘•°ğ½ÍÁ…¸øğ½±…‰•°ø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™¥•±µÉ½Üˆø(€€€€€€€€€€€€€€€íÙ…±Õ•Ì¹½•™™¥¥•¹Ñ5½‘”€ôôô€‰µ…¹Õ…°ˆ€ü€ (€€€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰±¥™Ñ½•™™¥¥•¹Ğˆ±…‰•°ô‰1¥™Ğ½•™™¥¥•¹Ğ°0ˆ¡•±Àô‰UÍ•ÈµÍÕÁÁ±¥•±¥™Ğ½•™™¥¥•¹Ğ™½ÈÑ¡”•¹Ñ•É•½Á•É…Ñ¥¹œ½¹‘¥Ñ¥½¸¸ˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€ğø(€€€€€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰±¥™Ñ½•™™¥¥•¹ÑÑi•É¼ˆ±…‰•°ô‰0…Ğé•É¼ƒ:ÄˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰±¥™ÑÕÉÙ•M±½Á•A•ÉI…ˆ±…‰•°ô‰1¥™ĞµÕÉÙ”Í±½Á”ˆÕ¹¥Ğô‰É…“Šï
äˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€€€ğ¼ø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰µ…á1¥™Ñ½•™™¥¥•¹Ğˆ±…‰•°ô‰5…á¥µÕ´0°1µ…àˆ¡•±Àô‰5…¥¸‘É¥Ù•È½˜Ñ¡”½¹”µœÍÑ…±°µÍÁ•••ÍÑ¥µ…Ñ”¸ˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™¥•±µÉ½Üˆø(€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰é•É½1¥™ÑÉ…½•™™¥¥•¹Ğˆ±…‰•°ô‰i•É¼µ±¥™Ğ‘É…œ°Àˆ¡•±Àô‰1ÕµÁÌÁ…É…Í¥Ñ¥Œ…¹ÁÉ½™¥±”‘É…œ¥¹Ñ¼Ñ¡”Í¥µÁ±¥™¥•‘É…œÁ½±…È¸ˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰½Íİ…±‘™™¥¥•¹äˆ±…‰•°ô‰=Íİ…±™…Ñ½È°”ˆ¡•±Àô‰MÁ…¸µ•™™¥¥•¹ä™…Ñ½ÈÕÍ•½¹±ä¥¸Ñ¡”¥¹‘Õ•µ‘É…œ•ÍÑ¥µ…Ñ”¸ˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€ñ¥•±¹…µ”ô‰…¹±•=™ÑÑ…­•œˆ±…‰•°ô‰¹±”½˜…ÑÑ…¬ˆÕ¹¥Ğô‰‘•œˆÉ•¥ÍÑ•ÈõíÉ•¥ÍÑ•Éô•ÉÉ½ÉÌõí•ÉÉ½ÉÍô€¼ø(€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µ½‘•°µ¹½Ñ”ˆø(€€€€€€€€€€€€€€€íÙ…±Õ•Ì¹½•™™¥¥•¹Ñ5½‘”€ôôô€‰µ…¹Õ…°ˆ(€€€€€€€€€€€€€€€€€€ü€‰1¥™Ğ½•™™¥¥•¹Ğ¥ÌÕÍ•ÈÍÕÁÁ±¥•¸]¥¹1…ˆ¥Ì¹½Ğ‘•É¥Ù¥¹œ0™É½´…¹±”½˜…ÑÑ…¬¥¸Ñ¡¥Ìµ½‘”¸ˆ(€€€€€€€€€€€€€€€€€€è‘Õ…Ñ¥½¹…°0€ô0À€¬‡:Ä¸™™•Ñ¥Ù”0¥Ì€‘í…¹…±åÍ¥Ì¹½•™™¥¥•¹ÑÌ¹•™™•Ñ¥Ù•1¥™Ñ½•™™¥¥•¹Ğ¹Ñ½¥á• Ì¥ô…¹¥Ì…ÁÁ•…Ğ1µ…àìÁ½ÍĞµÍÑ…±°‰•¡…Ù¥½È¥Ì¹½ĞÁÉ•‘¥Ñ•¹ô(€€€€€€€€€€€€€€ğ½Àø(€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ğ½‘•Ñ…¥±Ìø((€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¥¹ÁÕĞµ…Ñ¥½¹Ìˆø(€€€€€€€€€€€€ñ	ÕÑÑ½¸Ù…É¥…¹Ğô‰ÁÉ¥µ…Éäˆ½¹±¥¬õíÍ…Ù•ÕÉÉ•¹ÑôøñM…Ù”Í¥é”õìÄÕô€¼øM…Ù”±½…±±äğ½	ÕÑÑ½¸ø(€€€€€€€€€€€€ñ	ÕÑÑ½¸Ù…É¥…¹Ğô‰Í•½¹‘…Éäˆ½¹±¥¬õí•áÁ½ÉÑ)Í½¹ôøñ¥±•)Í½¸Í¥é”õìÄÕô€¼øáÁ½ÉĞ)M=8ğ½	ÕÑÑ½¸ø(€€€€€€€€€€€€ñ	ÕÑÑ½¸Ù…É¥…¹Ğô‰Í•½¹‘…Éäˆ½¹±¥¬õì ¤€ôøİ¥¹‘½Ü¹ÁÉ¥¹Ğ ¥ôøñAÉ¥¹Ñ•ÈÍ¥é”õìÄÕô€¼øAÉ¥¹Ğ€¼Ağ½	ÕÑÑ½¸ø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€íÍ…Ù•5•ÍÍ…”€˜˜€ñÀ±…ÍÍ9…µ”ô‰Í…Ù”µµ•ÍÍ…”ˆÉ½±”ô‰ÍÑ…ÑÕÌˆùíÍ…Ù•5•ÍÍ…•ôğ½Àùô((€€€€€€€€€€ñÍ•Ñ¥½¸¥ô‰Í…Ù•µ‘•Í¥¹Ìˆ±…ÍÍ9…µ”ô‰Í…Ù•µ‘•Í¥¹Ìˆø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á…¹•°µ¡•…‘¥¹œˆø(€€€€€€€€€€€€€€ñ‘¥ØøñÍÁ…¸±…ÍÍ9…µ”ô‰•å•‰É½Üˆù1=01%	IIdğ½ÍÁ…¸øñ ÈùM…Ù•‘•Í¥¹Ìğ½ Èøğ½‘¥Øø(€€€€€€€€€€€€€€ñ	…‘”ùíÍ…Ù•‘•Í¥¹Ì¹±•¹Ñ¡ô¼àğ½	…‘”ø(€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€íÍ…Ù•‘•Í¥¹Ì¹±•¹Ñ €ôôô€À€ü€ (€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰•µÁÑäµÍÑ…Ñ”ˆù9¼Í…Ù•‘•Í¥¹Ì¥¸Ñ¡¥Ì‰É½İÍ•Èå•Ğ¸ğ½Àø(€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Í…Ù•µ±¥ÍĞˆø(€€€€€€€€€€€€€€€íÍ…Ù•‘•Í¥¹Ì¹µ…À ¡‘•Í¥¸¤€ôø€ (€€€€€€€€€€€€€€€€€€ñ…ÉÑ¥±”­•äõí‘•Í¥¸¹¥‘ôø(€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰Í…Ù•µµ…¥¸ˆ½¹±¥¬õì ¤€ôø±½…‘M…Ù•¡‘•Í¥¸¥ôø(€€€€€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùí‘•Í¥¸¹¹…µ•ôğ½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùí¹•Ü…Ñ”¡‘•Í¥¸¹Í…Ù•‘Ğ¤¹Ñ½1½…±•…Ñ•MÑÉ¥¹œ ¥ôƒ
ÜHí‘•Í¥¸¹…¹…±åÍ¥Ì¹•½µ•ÑÉä¹…ÍÁ•ÑI…Ñ¥¼¹Ñ½¥á• È¥ôğ½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸…É¥„µ±…‰•°õíÕÁ±¥…Ñ”€‘í‘•Í¥¸¹¹…µ•õôÑ¥Ñ±”ô‰ÕÁ±¥…Ñ”ˆ½¹±¥¬õì ¤€ôø‘ÕÁ±¥…Ñ”¡‘•Í¥¸¥ôøñ½ÁäÍ¥é”õìÄÑô€¼øğ½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸…É¥„µ±…‰•°õíI•¹…µ”€‘í‘•Í¥¸¹¹…µ•õôÑ¥Ñ±”ô‰I•¹…µ”ˆ½¹±¥¬õì ¤€ôøÉ•¹…µ”¡‘•Í¥¸¥ôøñA•¹¥°Í¥é”õìÄÑô€¼øğ½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸…É¥„µ±…‰•°õí•±•Ñ”€‘í‘•Í¥¸¹¹…µ•õôÑ¥Ñ±”ô‰•±•Ñ”ˆ½¹±¥¬õì ¤€ôøÉ•µ½Ù”¡‘•Í¥¸¥ôøñQÉ…Í ÈÍ¥é”õìÄÑô€¼øğ½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€€€€€ğ½…ÉÑ¥±”ø(€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€¥ô(€€€€€€€€€€ğ½Í•Ñ¥½¸ø(€€€€€€€€ğ½…Í¥‘”ø((€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ù¥ÍÕ…°µ½±Õµ¸ˆø(€€€€€€€€€€ñ]¥¹Y¥ÍÕ…±¥é•È¥¹ÁÕĞõí¥¹ÁÕÑô…¹…±åÍ¥Ìõí…¹…±åÍ¥Íô€¼ø(€€€€€€€€€€ñ±½İY¥ÍÕ…±¥é…Ñ¥½¸¥¹ÁÕĞõí¥¹ÁÕÑô…¹…±åÍ¥Ìõí…¹…±åÍ¥Íô€¼ø(€€€€€€€€ğ½‘¥Øø((€€€€€€€€ñ…Í¥‘”±…ÍÍ9…µ”ô‰É•ÍÕ±ÑÌµÁ…¹•°ˆ…É¥„µ±…‰•°ô‰•É½‘å¹…µ¥ŒÉ•ÍÕ±ÑÌˆø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á…¹•°µ¡•…‘¥¹œÍÑ¥­äµ¡•…‘¥¹œˆø(€€€€€€€€€€€€ñ‘¥ØøñÍÁ…¸±…ÍÍ9…µ”ô‰•å•‰É½Üˆù91eM%L=UQAUPğ½ÍÁ…¸øñ ÈùAÉ•±¥µ¥¹…ÉäÉ•ÍÕ±ÑÌğ½ Èøğ½‘¥Øø(€€€€€€€€€€€€ñ]¥¹Í¥é”õìÈÁô€¼ø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É•ÍÕ±ÑÌµÉ¥ˆ…É¥„µ±¥Ù”ô‰Á½±¥Ñ”ˆø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰ÍÑ¥µ…Ñ•±¥™ĞˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡™½É”¡…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹±¥™Ñ8¤°€Ğ¥ôÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰±‰˜ˆ€è€‰8‰ô•áÁ±…¹…Ñ¥½¸ô‰ÅM0Õ¹‘•ÈÑ¡”•¹Ñ•É•…ÍÍÕµÁÑ¥½¹Ì¸ˆ½¹™¥‘•¹”õí±¥™Ñ½¹™¥‘•¹•ô…•¹Ğ€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰¥ÉÉ…™Ğİ•¥¡ĞˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡™½É”¡…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹İ•¥¡Ñ8¤°€Ğ¥ôÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰±‰˜ˆ€è€‰8‰ô•áÁ±…¹…Ñ¥½¸ô‰5…ÍÌƒ\É…Ù¥Ñ…Ñ¥½¹…°…•±•É…Ñ¥½¸¸ˆ½¹™¥‘•¹”õí•½µ•ÑÉå½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰1¥™Ğµ…É¥¸ˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡…¹…±åÍ¥Ì¹ÍÑ…ÑÕÌ¹±¥™Ñ5…É¥¸°€Ì¥ôÕ¹¥Ğô‹\İ•¥¡Ğˆ•áÁ±…¹…Ñ¥½¸ô‰	•±½Ü€Ä¸À¥Ì¥¹ÍÕ™™¥¥•¹Ğ™½ÈÍÑ•…‘ä±•Ù•°™±¥¡Ğ¸ˆ½¹™¥‘•¹”õí±¥™Ñ½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰ÍÑ¥µ…Ñ•‘É…œˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡™½É”¡…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹‘É…8¤°€Ğ¥ôÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰±‰˜ˆ€è€‰8‰ô•áÁ±…¹…Ñ¥½¸ô‰M¥µÁ±¥™¥•Á…É…‰½±¥Œ‘É…œµÁ½±…ÈÉ•ÍÕ±Ğ¸ˆ½¹™¥‘•¹”õí‘É…½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰ÍÑ¥µ…Ñ•ÍÑ…±°ÍÁ••ˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡ÍÁ••¡…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹ÍÑ…±±MÁ••‘5L¤°€Ì¥ôÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰µÁ ˆ€è€‰´½Ì‰ô•áÁ±…¹…Ñ¥½¸ô‰=¹”µœ°ÍÑ•…‘äµ™±¥¡Ğ•ÍÑ¥µ…Ñ”½¹±ä¸ˆ½¹™¥‘•¹”õíÍÑ…±±½¹™¥‘•¹•ô…•¹Ğ€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰5…ÍÌİ¥¹œ±½…‘¥¹œˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡µ…ÍÍ1½…‘¥¹œ°€Ğ¥ôÕ¹¥Ğõí¥µÁ•É¥…°€ü€‰±‰´½™Ó
Èˆ€è€‰­œ½·
È‰ô•áÁ±…¹…Ñ¥½¸õí]•¥¡Ğ±½…‘¥¹œè€‘í™½Éµ…Ñ9Õµ‰•È¡İ•¥¡Ñ1½…‘¥¹œ°€Ğ¥ô€‘í¥µÁ•É¥…°€ü€‰±‰˜½™Ó
Èˆ€è€‰8½·
È‰ô¹ô½¹™¥‘•¹”õí•½µ•ÑÉå½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰ÍÁ•ĞÉ…Ñ¥¼ˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡…¹…±åÍ¥Ì¹•½µ•ÑÉä¹…ÍÁ•ÑI…Ñ¥¼°€Ğ¥ô•áÁ±…¹…Ñ¥½¸ô‰]¥¹ÍÁ…»
È‘¥Ù¥‘•‰äÉ•™•É•¹”…É•„¸ˆ½¹™¥‘•¹”õí•½µ•ÑÉå½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰I•å¹½±‘Ì¹Õµ‰•ÈˆÙ…±Õ”õí…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹É•å¹½±‘Í9Õµ‰•È¹Ñ½áÁ½¹•¹Ñ¥…° Ì¥ô•áÁ±…¹…Ñ¥½¸ô‰UÍ•Ìµ•…¸…•É½‘å¹…µ¥Œ¡½É¸ˆ½¹™¥‘•¹”õíÉ•å¹½±‘Í½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰Q½Ñ…°‘É…œ½•™™¥¥•¹ĞˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡…¹…±åÍ¥Ì¹½•™™¥¥•¹ÑÌ¹Ñ½Ñ…±É…½•™™¥¥•¹Ğ°€Ğ¥ô•áÁ±…¹…Ñ¥½¸õíÀ€¬¤ì¥¹‘Õ•½¹ÑÉ¥‰ÕÑ¥½¸€‘í…¹…±åÍ¥Ì¹½•™™¥¥•¹ÑÌ¹¥¹‘Õ•‘É…½•™™¥¥•¹Ğ¹Ñ½¥á• Ğ¥ô¹ô½¹™¥‘•¹”õí‘É…½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰1¥™ĞµÑ¼µ‘É…œÉ…Ñ¥¼ˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹±¥™ÑQ½É…I…Ñ¥¼°€Ğ¥ô•áÁ±…¹…Ñ¥½¸õí½É”¡•¬è€‘í…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹±¥™ÑQ½É…½É•I…Ñ¥¼¹Ñ½¥á• Ì¥ô¹ô½¹™¥‘•¹”õí‘É…½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰I•ÅÕ¥É•0ˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹É•ÅÕ¥É•‘1¥™Ñ½•™™¥¥•¹Ğ°€Ğ¥ô•áÁ±…¹…Ñ¥½¸õí½È±•Ù•°™±¥¡Ğì½µÁ…É”İ¥Ñ 1µ…à€‘í¥¹ÁÕĞ¹µ…á1¥™Ñ½•™™¥¥•¹Ğ¹Ñ½¥á• È¥ô¹ô½¹™¥‘•¹”õí±¥™Ñ½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€€€ñI•ÍÕ±Ñ…É±…‰•°ô‰%‘•…±¥é•±¥‘”…¹±”ˆÙ…±Õ”õí™½Éµ…Ñ9Õµ‰•È¡…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹±¥‘•¹±••É••Ì°€Ì¥ôÕ¹¥Ğô‰‘•œˆ•áÁ±…¹…Ñ¥½¸õí%‘•…±¥é•±¥‘”É…Ñ¥¼€‘í…¹…±åÍ¥Ì¹Á•É™½Éµ…¹”¹±¥™ÑQ½É…I…Ñ¥¼¹Ñ½¥á• È¥ôèÄ¹ô½¹™¥‘•¹”õí±¥‘•½¹™¥‘•¹•ô€¼ø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€ğ½…Í¥‘”ø(€€€€€€ğ½‘¥Øø((€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰±½İ•ÈµÉ¥ˆø(€€€€€€€€ñ¹…±åÍ¥Í¡…ÉÑÌ¥¹ÁÕĞõí¥¹ÁÕÑô…¹…±åÍ¥Ìõí…¹…±åÍ¥Íô€¼ø(€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰…ÍÍÕµÁÑ¥½¹Ìµ…Éˆø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á…¹•°µ¡•…‘¥¹œˆø(€€€€€€€€€€€€ñ‘¥ØøñÍÁ…¸±…ÍÍ9…µ”ô‰•å•‰É½ÜˆùMMU5AQ%=9L%8Y%\ğ½ÍÁ…¸øñ Èù]¡…ĞÑ¡¥ÌÉ•ÍÕ±Ğµ•…¹Ìğ½ Èøğ½‘¥Øø(€€€€€€€€€€€€ñ%¹™¼Í¥é”õìÈÁô€¼ø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…ÍÍÕµÁÑ¥½¸µ‰±½¬ˆø(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰…ÍÍÕµÁÑ¥½¸µ¥¹‘•àˆùğ½ÍÁ…¸ø(€€€€€€€€€€€€ñ‘¥ØøñÍÑÉ½¹œù½•™™¥¥•¹ĞÁÉ½Ù•¹…¹”ğ½ÍÑÉ½¹œøñÀùí¥¹ÁÕĞ¹½•™™¥¥•¹ÑM½ÕÉ”€ôôô€‰É•‘¥‰±”ˆ€ü€‰5…É­•…ÌÍÕÁÁ±¥•™É½´„É•‘¥‰±”Í½ÕÉ”ì]¥¹1…ˆ‘½•Ì¹½ĞÙ•É¥™äÑ¡”Í½ÕÉ”¸ˆ€è€‰‘Õ…Ñ¥½¹…°½ÈÕÍ•Èµ‘•™¥¹•½•™™¥¥•¹ÑÌ…É”¹½Ğ…¥É™½¥°ÁÉ•‘¥Ñ¥½¹Ì¸‰ôğ½Àøğ½‘¥Øø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…ÍÍÕµÁÑ¥½¸µ‰±½¬ˆø(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰…ÍÍÕµÁÑ¥½¸µ¥¹‘•àˆùğ½ÍÁ…¸ø(€€€€€€€€€€€€ñ‘¥ØøñÍÑÉ½¹œùMÑ…±°¥¹Ñ•ÉÁÉ•Ñ…Ñ¥½¸ğ½ÍÑÉ½¹œøñÀùYÌ¥Ì…¸•ÍÑ¥µ…Ñ•½¹”µœÍÑ•…‘äµ™±¥¡ĞÙ…±Õ”¸QÕÉ¹Ì°ÕÍÑÌ°‘å¹…µ¥ŒÍÑ…±°°É½Õ¹•™™•Ğ°…¹½¹ÑÉ½°‘•™±•Ñ¥½¸…É”•á±Õ‘•¸ğ½Àøğ½‘¥Øø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…ÍÍÕµÁÑ¥½¸µ‰±½¬ˆø(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰…ÍÍÕµÁÑ¥½¸µ¥¹‘•àˆùğ½ÍÁ…¸ø(€€€€€€€€€€€€ñ‘¥ØøñÍÑÉ½¹œùÉ…œ¥¹Ñ•ÉÁÉ•Ñ…Ñ¥½¸ğ½ÍÑÉ½¹œøñÀù€ôÀ€¬3
È¼£>•H¤¸ÀµÕÍĞÉ•ÁÉ•Í•¹ĞÑ¡”•™™•ÑÌÑ¡”ÕÍ•È¥¹Ñ•¹‘ÌÑ¼¥¹±Õ‘”ìÑÉ¥´…¹ÁÉ½ÁÕ±Í¥½¸±½ÍÍ•Ì…É”¹½ĞÍ•Á…É…Ñ•±äµ½‘•±•¸ğ½Àøğ½‘¥Øø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ñÕ°±…ÍÍ9…µ”ô‰İ…É¹¥¹œµ±¥ÍĞˆø(€€€€€€€€€€€í…¹…±åÍ¥Ì¹ÍÑ…ÑÕÌ¹µ½‘•±]…É¹¥¹Ì¹µ…À ¡İ…É¹¥¹œ¤€ôø€ñ±¤­•äõíİ…É¹¥¹ôøñ±•ÉÑQÉ¥…¹±”Í¥é”õìÄÑô€¼ùíİ…É¹¥¹ôğ½±¤ø¥ô(€€€€€€€€€€ğ½Õ°ø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰±¥µ¥Ñ…Ñ¥½¸µ…±±½ÕĞˆø(€€€€€€€€€€€€ñÍÑÉ½¹œù9½Ğ„™±¥¡ĞµÍ…™•Ñä‘•Ñ•Éµ¥¹…Ñ¥½¸¸ğ½ÍÑÉ½¹œø(€€€€€€€€€€€€ñÀùMÕ™™¥¥•¹ĞÑ¡•½É•Ñ¥…°±¥™Ğ‘½•Ì¹½ĞÕ…É…¹Ñ•”ÍÑ…‰±”°½¹ÑÉ½±±…‰±”°ÍÑÉÕÑÕÉ…±±äÍ…™”°½È™±¥¡ĞµÉ•…‘ä‰•¡…Ù¥½È¸ğ½Àø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€ğ½Í•Ñ¥½¸ø(€€€€€€ğ½‘¥Øø(€€€€ğ½µ…¥¸ø(€€¤ì)ô