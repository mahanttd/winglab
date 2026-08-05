import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ChartNoAxesCombined,
  CheckCircle2,
  Ruler,
  ShieldAlert,
  Wind,
} from "lucide-react";
import { PageFooter } from "@/components/PageFooter";
import { SiteHeader } from "@/components/SiteHeader";

const calculations = [
  ["Lift & margin", "Compare estimated lift with aircraft weight without implying a flight outcome.", Wind],
  ["Stall speed", "Estimate one-g steady-flight stall speed from a clearly identified CLmax.", ShieldAlert],
  ["Drag & efficiency", "Explore induced and parasitic drag with a transparent parabolic polar.", ChartNoAxesCombined],
  ["Geometry", "Calculate area, aspect ratio, MAC, and separate mass from weight loading.", Ruler],
  ["Flow regime", "Track Reynolds and Mach numbers with low-speed model warnings.", Calculator],
  ["Validation", "Inspect formulas, assumptions, benchmark values, and numerical tolerances.", CheckCircle2],
] as const;

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="home-page">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">PRELIMINARY AERODYNAMIC ANALYSIS</span>
            <h1>Shape a wing.<br /><span>See the physics.</span></h1>
            <p className="hero-lede">
              WingLab turns defined geometry, operating conditions, and user-supplied
              coefficients into traceable aerodynamic estimates—without hiding the assumptions.
            </p>
            <div className="hero-actions">
              <Link href="/simulator" className="button button-primary button-large">
                Launch simulator <ArrowRight size={17} />
              </Link>
              <Link href="/methodology" className="button button-secondary button-large">
                Review the model
              </Link>
            </div>
            <div className="hero-standards">
              <span><CheckCircle2 size={15} /> SI calculation core</span>
              <span><CheckCircle2 size={15} /> Explicit uncertainty</span>
              <span><CheckCircle2 size={15} /> Local-only designs</span>
            </div>
          </div>

          <div className="hero-preview" aria-label="Preview of the WingLab simulator">
            <div className="preview-topline">
              <span>WL / PLANFORM STUDY 01</span>
              <span className="live-indicator">VALID CASE</span>
            </div>
            <div className="preview-body">
              <div className="preview-panel preview-inputs">
                <span className="tiny-label">GEOMETRY</span>
                <PreviewField label="Span" value="2.40 m" />
                <PreviewField label="Root chord" value="0.22 m" />
                <PreviewField label="Tip chord" value="0.12 m" />
                <PreviewField label="Sweep" value="3.0°" />
                <div className="preview-rule" />
                <span className="tiny-label">CONDITION</span>
                <PreviewField label="Airspeed" value="12.0 m/s" />
                <PreviewField label="CL" value="0.55" />
              </div>
              <div className="preview-canvas">
                <span className="tiny-label">TOP VIEW / LIVE</span>
                <svg viewBox="0 0 500 360" role="img" aria-label="Tapered wing planform preview">
                  <defs>
                    <pattern id="heroGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M25 0H0V25" fill="none" stroke="var(--grid-line)" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="heroWing" x1="0" x2="1">
                      <stop offset="0" stopColor="var(--cyan)" stopOpacity=".42" />
                      <stop offset="1" stopColor="var(--blue)" stopOpacity=".08" />
                    </linearGradient>
                  </defs>
                  <rect width="500" height="360" fill="url(#heroGrid)" />
                  <line x1="250" y1="15" x2="250" y2="345" className="centerline" />
                  <polygon points="190,180 228,24 276,24 310,180" fill="url(#heroWing)" className="wing-outline" />
                  <polygon points="190,180 228,336 276,336 310,180" fill="url(#heroWing)" className="wing-outline" />
                  <line x1="137" y1="24" x2="137" y2="336" className="dimension" />
                  <text x="124" y="180" className="svg-label" textAnchor="middle" transform="rotate(-90 124 180)">SPAN 2.40 m</text>
                  <line x1="222" y1="116" x2="287" y2="116" className="mac-line" />
                  <text x="300" y="120" className="svg-label accent">MAC 0.176 m</text>
                </svg>
              </div>
              <div className="preview-panel preview-results">
                <span className="tiny-label">OUTPUT</span>
                <PreviewMetric label="Lift" value="16.5 N" accent />
                <PreviewMetric label="Weight" value="13.2 N" />
                <PreviewMetric label="Stall speed" value="6.60 m/s" accent />
                <PreviewMetric label="L / D" value="18.4" />
                <PreviewMetric label="Reynolds" value="1.43 × 10⁵" />
              </div>
            </div>
            <div className="preview-footer">
              <span>Educational estimate · coefficient quality controls confidence</span>
              <span>Not CFD</span>
            </div>
          </div>
        </section>

        <section className="home-section what-section">
          <div className="section-intro">
            <span className="eyebrow">ONE MODEL, CLEAR BOUNDARIES</span>
            <h2>Answers you can inspect.</h2>
            <p>
              Every output is tagged by what drives it: geometry, supplied coefficient,
              environment, or simplified model.
            </p>
          </div>
          <div className="calculation-grid">
            {calculations.map(([title, body, Icon], index) => (
              <article key={title}>
                <span className="feature-number">0{index + 1}</span>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section honesty-section">
          <div className="honesty-panel">
            <span className="eyebrow">WHY WINGLAB REPORTS UNCERTAINTY</span>
            <h2>Precision is not the same as truth.</h2>
            <p>
              Lift and drag coefficients can change with airfoil shape, Reynolds number,
              roughness, transition, separation, and the aircraft around the wing. WingLab
              keeps those unknowns visible instead of manufacturing confidence percentages.
            </p>
            <Link href="/validation">See benchmark validation <ArrowRight size={15} /></Link>
          </div>
          <div className="confidence-stack">
            <div><BadgeDot tone="high" /><span><strong>High confidence</strong>Defined geometry, aspect ratio, unit conversions</span></div>
            <div><BadgeDot tone="medium" /><span><strong>Medium confidence</strong>Reynolds number or lift with credible inputs</span></div>
            <div><BadgeDot tone="low" /><span><strong>Low confidence</strong>Drag and glide with generic coefficients</span></div>
          </div>
        </section>

        <section className="limitations-section">
          <div>
            <span className="eyebrow">MODEL ENVELOPE</span>
            <h2>A preliminary tool, by design.</h2>
          </div>
          <div className="limitation-grid">
            <p><strong>Not CFD.</strong> No flow-field, boundary-layer transition, or separated-flow solution.</p>
            <p><strong>Not flight certification.</strong> No structural, stability, controllability, or safety analysis.</p>
            <p><strong>Not post-stall.</strong> Stall speed depends strongly on CLmax; dynamic behavior is excluded.</p>
            <p><strong>Not full-aircraft simulation.</strong> Wind, gusts, turns, trim, propulsion, and pilot technique are outside scope.</p>
          </div>
          <Link href="/simulator" className="button button-primary button-large">
            Start a wing study <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <PageFooter />
    </>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return <div className="preview-field"><span>{label}</span><strong>{value}</strong></div>;
}

function PreviewMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`preview-metric ${accent ? "accent" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function BadgeDot({ tone }: { tone: string }) {
  return <span className={`confidence-dot ${tone}`} aria-hidden="true" />;
}

