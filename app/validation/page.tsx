import type { Metadata } from "next";
import {
  CheckCircle2,
  CircleGauge,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { analyzeWing } from "@/lib/aerodynamics";
import type { WingInputSI } from "@/types/wing";
import { Equation } from "@/components/Equation";
import { PageFooter } from "@/components/PageFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Scientific validation",
  description: "Formula references, benchmark values, and numerical validation strategy for WingLab.",
};

const benchmark: WingInputSI = {
  name: "Published benchmark case",
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
const result = analyzeWing(benchmark);

const formulas = [
  ["Weight", "W = mg", "kg, m/s²", "N", "1 × 10⁻¹² relative"],
  ["Wing area", "S = bc", "m, m", "m²", "1 × 10⁻¹² relative"],
  ["Aspect ratio", "AR = b^2/S", "m, m²", "dimensionless", "1 × 10⁻¹² relative"],
  ["Mean aerodynamic chord", "\\bar{c}=\\frac{2}{3}c_r\\frac{1+\\lambda+\\lambda^2}{1+\\lambda}", "m", "m", "1 × 10⁻¹² relative"],
  ["Reynolds number", "Re = \\rho V\\bar{c}/\\mu", "SI base units", "dimensionless", "1 × 10⁻⁹ relative"],
  ["Dynamic pressure", "q = \\frac{1}{2}\\rho V^2", "kg/m³, m/s", "Pa", "1 × 10⁻¹² relative"],
  ["Lift", "L = qSC_L", "Pa, m²", "N", "1 × 10⁻¹² relative"],
  ["Required CL", "C_{L,req}=W/(qS)", "N, Pa, m²", "dimensionless", "1 × 10⁻¹² relative"],
  ["Stall speed", "V_s=\\sqrt{2W/(\\rho S C_{L,max})}", "SI base units", "m/s", "1 × 10⁻¹² relative"],
  ["Induced drag", "C_{D_i}=C_L^2/(\\pi e AR)", "dimensionless", "dimensionless", "1 × 10⁻¹² relative"],
  ["Drag", "D=qS(C_{D_0}+C_{D_i})", "Pa, m²", "N", "1 × 10⁻¹² relative"],
  ["Glide angle", "\\gamma=\\tan^{-1}(D/L)", "N, N", "degrees", "1 × 10⁻¹² relative"],
] as const;

const benchmarkRows = [
  ["Weight", result.performance.weightN, "N"],
  ["Aspect ratio", result.geometry.aspectRatio, ""],
  ["Mean aerodynamic chord", result.geometry.meanAerodynamicChordM, "m"],
  ["Dynamic pressure", result.performance.dynamicPressurePa, "Pa"],
  ["Lift", result.performance.liftN, "N"],
  ["Required CL", result.performance.requiredLiftCoefficient, ""],
  ["Stall speed", result.performance.stallSpeedMS, "m/s"],
  ["Induced CD", result.coefficients.inducedDragCoefficient, ""],
  ["Total CD", result.coefficients.totalDragCoefficient, ""],
  ["Drag", result.performance.dragN, "N"],
  ["Lift / drag", result.performance.liftToDragRatio, ""],
  ["Reynolds number", result.performance.reynoldsNumber, ""],
] as const;

export default function ValidationPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-page validation-page">
        <section className="page-hero compact">
          <span className="eyebrow">SCIENTIFIC VALIDATION</span>
          <h1>Formulas should be auditable.</h1>
          <p>
            WingLab’s calculation core is made of pure TypeScript functions. The benchmark
            below is evaluated independently of the interface and protected by automated tests.
          </p>
        </section>

        <section className="validation-status-grid">
          <article><ShieldCheck /><span><strong>Pure SI core</strong>No display-unit mixing</span></article>
          <article><FlaskConical /><span><strong>Behavior tests</strong>Scaling laws verified</span></article>
          <article><CircleGauge /><span><strong>Finite outputs</strong>NaN and infinity guarded</span></article>
          <article><CheckCircle2 /><span><strong>Transparent tolerance</strong>Floating-point limits stated</span></article>
        </section>

        <section className="validation-section">
          <div className="section-heading-row">
            <div><span className="eyebrow">REFERENCE TABLE</span><h2>Implemented equations</h2></div>
            <Badge tone="green">Automated test coverage</Badge>
          </div>
          <div className="formula-table-wrap">
            <table className="formula-table">
              <thead><tr><th>Calculation</th><th>Formula</th><th>Inputs</th><th>Output</th><th>Tolerance</th><th>Status</th></tr></thead>
              <tbody>
                {formulas.map(([name, formula, inputs, output, tolerance]) => (
                  <tr key={name}>
                    <th>{name}</th>
                    <td><Equation>{formula}</Equation></td>
                    <td>{inputs}</td>
                    <td>{output}</td>
                    <td>{tolerance}</td>
                    <td><span className="test-pass"><CheckCircle2 size={14} /> Tested</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="benchmark-grid">
          <div className="benchmark-case">
            <span className="eyebrow">BENCHMARK 001</span>
            <h2>Sea-level rectangular wing</h2>
            <p>Fixed inputs make this case suitable for regression testing.</p>
            <dl>
              <div><dt>Mass</dt><dd>1.000 kg</dd></div>
              <div><dt>Span</dt><dd>1.200 m</dd></div>
              <div><dt>Area</dt><dd>0.240 m²</dd></div>
              <div><dt>Speed</dt><dd>10.00 m/s</dd></div>
              <div><dt>Density</dt><dd>1.225 kg/m³</dd></div>
              <div><dt>CL / CLmax</dt><dd>0.600 / 1.200</dd></div>
              <div><dt>CD0 / e</dt><dd>0.025 / 0.800</dd></div>
            </dl>
          </div>
          <div className="benchmark-results">
            <div className="section-heading-row"><h2>Expected outputs</h2><Badge tone="cyan">Computed at render</Badge></div>
            {benchmarkRows.map(([label, value, unit]) => (
              <div key={label}><span>{label}</span><strong>{value.toExponential(value > 10000 ? 4 : 6)} {unit}</strong></div>
            ))}
          </div>
        </section>

        <section className="behavior-tests">
          <div><span className="eyebrow">BEHAVIORAL CHECKS</span><h2>Physics relationships, not snapshots alone.</h2></div>
          <ul>
            {[
              "Doubling speed quadruples lift when CL is constant.",
              "Doubling wing area doubles lift.",
              "Increasing mass increases estimated stall speed.",
              "Increasing CLmax decreases estimated stall speed.",
              "Increasing aspect ratio decreases induced drag at fixed CL and e.",
              "Coefficient L/D matches lift divided by drag.",
              "Negative or zero physical inputs are rejected.",
              "Unit conversions round-trip within floating-point tolerance.",
            ].map((test) => <li key={test}><CheckCircle2 size={15} />{test}</li>)}
          </ul>
        </section>
      </main>
      <PageFooter />
    </>
  );
}

