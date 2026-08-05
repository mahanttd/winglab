"use client";

import { useMemo, useState } from "react";
import { Maximize2, RotateCcw } from "lucide-react";
import type { WingAnalysis, WingInputSI } from "@/types/wing";
import { Button } from "@/components/ui/button";

export function WingVisualizer({
  input,
  analysis,
}: {
  input: WingInputSI;
  analysis: WingAnalysis;
}) {
  const [zoom, setZoom] = useState(1);
  const geometry = useMemo(() => {
    const halfSpan = Math.max(input.spanM / 2, 0.01);
    const maxChord = Math.max(input.rootChordM, input.tipChordM, 0.01);
    const yScale = 250 / halfSpan;
    const xScale = 116 / maxChord;
    const rootHalf = (input.rootChordM * xScale) / 2;
    const tipHalf = ((input.planform === "rectangular" ? input.rootChordM : input.tipChordM) * xScale) / 2;
    const sweepPx = Math.tan((input.sweepDeg * Math.PI) / 180) * halfSpan * yScale;
    const centerX = 300;
    const rootY = 290;
    const tipY = 40;
    const topPoints = `${centerX - rootHalf},${rootY} ${centerX - tipHalf + sweepPx},${tipY} ${centerX + tipHalf + sweepPx},${tipY} ${centerX + rootHalf},${rootY}`;
    const bottomPoints = `${centerX - rootHalf},${rootY} ${centerX - tipHalf + sweepPx},${540 - tipY} ${centerX + tipHalf + sweepPx},${540 - tipY} ${centerX + rootHalf},${rootY}`;
    return { centerX, rootHalf, tipHalf, sweepPx, tipY, rootY, topPoints, bottomPoints };
  }, [input]);

  const macX = geometry.centerX + geometry.sweepPx * 0.42;
  const macHalf = (analysis.geometry.meanAerodynamicChordM / Math.max(input.rootChordM, input.tipChordM)) * 58;

  return (
    <section className="visualizer-card" aria-labelledby="planform-title">
      <div className="panel-heading visualizer-heading">
        <div>
          <span className="eyebrow">LIVE PLANFORM</span>
          <h2 id="planform-title">{input.name || "Untitled design"}</h2>
        </div>
        <div className="visualizer-controls">
          <Button size="sm" variant="ghost" onClick={() => setZoom(1)} title="Zoom to fit">
            <Maximize2 size={15} /> Fit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setZoom(1)} title="Reset view">
            <RotateCcw size={15} /> Reset
          </Button>
        </div>
      </div>

      <div className="wing-canvas">
        <svg
          viewBox="0 0 600 540"
          role="img"
          aria-labelledby="wing-viz-title wing-viz-description"
          style={{ transform: `scale(${zoom})` }}
        >
          <title id="wing-viz-title">Top view of the entered wing geometry</title>
          <desc id="wing-viz-description">
            A live proportional planform showing wingspan, root and tip chords, sweep, mean aerodynamic chord, and airflow direction.
          </desc>
          <defs>
            <linearGradient id="wingFill" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--cyan)" stopOpacity=".34" />
              <stop offset="100%" stopColor="var(--blue)" stopOpacity=".13" />
            </linearGradient>
            <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="var(--grid-line)" strokeWidth="1" />
            </pattern>
            <marker id="arrowCyan" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--cyan)" />
            </marker>
          </defs>
          <rect width="600" height="540" rx="20" fill="url(#grid)" />
          <line x1="300" y1="18" x2="300" y2="522" className="centerline" />
          <polygon points={geometry.topPoints} fill="url(#wingFill)" className="wing-outline" />
          <polygon points={geometry.bottomPoints} fill="url(#wingFill)" className="wing-outline" />
          <line
            x1={geometry.centerX - geometry.rootHalf}
            y1={geometry.rootY}
            x2={geometry.centerX + geometry.rootHalf}
            y2={geometry.rootY}
            className="dimension-strong"
          />
          <line
            x1={geometry.centerX - geometry.tipHalf + geometry.sweepPx}
            y1={geometry.tipY}
            x2={geometry.centerX + geometry.tipHalf + geometry.sweepPx}
            y2={geometry.tipY}
            className="dimension"
          />
          <line
            x1={macX - macHalf}
            y1="185"
            x2={macX + macHalf}
            y2="185"
            className="mac-line"
          />
          <text x={macX + macHalf + 8} y="189" className="svg-label accent">
            MAC {analysis.geometry.meanAerodynamicChordM.toFixed(3)} m
          </text>
          <line x1="112" y1="40" x2="112" y2="500" className="dimension" />
          <line x1="104" y1="40" x2="120" y2="40" className="dimension" />
          <line x1="104" y1="500" x2="120" y2="500" className="dimension" />
          <text x="96" y="270" className="svg-label" textAnchor="middle" transform="rotate(-90 96 270)">
            SPAN {input.spanM.toFixed(2)} m
          </text>
          <text x="340" y="305" className="svg-label">
            ROOT {input.rootChordM.toFixed(2)} m
          </text>
          <text
            x={geometry.centerX + geometry.tipHalf + geometry.sweepPx + 10}
            y={geometry.tipY + 4}
            className="svg-label"
          >
            TIP {(input.planform === "rectangular" ? input.rootChordM : input.tipChordM).toFixed(2)} m
          </text>
          <line x1="505" y1="92" x2="505" y2="36" className="airflow-line" markerEnd="url(#arrowCyan)" />
          <text x="505" y="112" className="svg-label accent" textAnchor="middle">
            RELATIVE AIRFLOW
          </text>
          <circle cx={macX - macHalf * 0.5} cy="185" r="5" className="quarter-chord" />
          <text x={macX - macHalf * 0.5} y="168" className="svg-tiny" textAnchor="middle">
            ¼-chord reference
          </text>
        </svg>
        <div className="visualizer-readout">
          <span><small>Planform</small>{input.planform === "rectangular" ? "Rectangular" : "Tapered"}</span>
          <span><small>Area</small>{analysis.geometry.wingAreaM2.toFixed(3)} m²</span>
          <span><small>Sweep</small>{input.sweepDeg.toFixed(1)}°</span>
          <span><small>AR</small>{analysis.geometry.aspectRatio.toFixed(2)}</span>
        </div>
      </div>
      <p className="microcopy">
        Quarter-chord is a geometric reference only—not a stability or aerodynamic-center analysis.
      </p>
    </section>
  );
}

