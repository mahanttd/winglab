import type { WingAnalysis, WingInputSI } from "@/types/wing";

export function FlowVisualization({
  input,
  analysis,
}: {
  input: WingInputSI;
  analysis: WingAnalysis;
}) {
  const angle = Math.max(-15, Math.min(15, input.angleOfAttackDeg));
  return (
    <section className="flow-card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SECTION VIEW</span>
          <h2>Flow & force directions</h2>
        </div>
        <span className="value-chip">α {input.angleOfAttackDeg.toFixed(1)}°</span>
      </div>
      <svg viewBox="0 0 720 255" role="img" aria-label="Conceptual airfoil flow and force direction diagram">
        <defs>
          <marker id="flowArrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" fill="var(--muted)" />
          </marker>
          <marker id="liftArrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" fill="var(--cyan)" />
          </marker>
        </defs>
        {[64, 92, 164, 192].map((y) => (
          <line key={y} x1="25" y1={y} x2="675" y2={y} className="flow-stream" markerEnd="url(#flowArrow)" />
        ))}
        <g transform={`rotate(${-angle} 360 130)`}>
          <path
            d="M175 132 C250 79, 455 70, 560 124 C470 149, 300 166, 175 132 Z"
            className="airfoil"
          />
          <line x1="175" y1="132" x2="560" y2="124" className="chord-reference" />
        </g>
        <line x1="390" y1="123" x2="390" y2="35" className="lift-vector" markerEnd="url(#liftArrow)" />
        <text x="405" y="45" className="svg-label accent">LIFT ≈ {analysis.performance.liftN.toFixed(1)} N</text>
        <line x1="390" y1="123" x2="500" y2="123" className="drag-vector" markerEnd="url(#flowArrow)" />
        <text x="443" y="110" className="svg-label">DRAG</text>
        <text x="315" y="83" className="svg-label">SUCTION SIDE</text>
        <text x="315" y="181" className="svg-label">PRESSURE SIDE</text>
      </svg>
      <div className="concept-label">
        Conceptual visualization — not computational fluid dynamics.
      </div>
    </section>
  );
}

