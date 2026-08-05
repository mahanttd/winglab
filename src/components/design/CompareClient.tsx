"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, GitCompareArrows, Info } from "lucide-react";
import { loadDesigns } from "@/lib/storage";
import type { SavedDesign } from "@/types/wing";
import { Badge } from "@/components/ui/badge";

type Metric = {
  label: string;
  unit: string;
  value: (design: SavedDesign) => number;
};

const metrics: Metric[] = [
  { label: "Wingspan", unit: "m", value: (d) => d.input.spanM },
  { label: "Wing area", unit: "m²", value: (d) => d.analysis.geometry.wingAreaM2 },
  { label: "Mass", unit: "kg", value: (d) => d.input.massKg },
  { label: "Mass wing loading", unit: "kg/m²", value: (d) => d.analysis.performance.wingLoadingKgM2 },
  { label: "Aspect ratio", unit: "", value: (d) => d.analysis.geometry.aspectRatio },
  { label: "Stall speed", unit: "m/s", value: (d) => d.analysis.performance.stallSpeedMS },
  { label: "Reynolds number", unit: "", value: (d) => d.analysis.performance.reynoldsNumber },
  { label: "Lift", unit: "N", value: (d) => d.analysis.performance.liftN },
  { label: "Drag", unit: "N", value: (d) => d.analysis.performance.dragN },
  { label: "Lift / drag", unit: "", value: (d) => d.analysis.performance.liftToDragRatio },
];

function formatted(value: number): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", { maximumSignificantDigits: 4 }).format(value)
    : "—";
}

export function CompareClient() {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const loaded = loadDesigns();
      setDesigns(loaded);
      setSelected(loaded.slice(0, 3).map((design) => design.id));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const shown = useMemo(
    () => selected.map((id) => designs.find((design) => design.id === id)).filter(Boolean) as SavedDesign[],
    [designs, selected],
  );
  const baseline = shown[0];

  if (designs.length === 0) {
    return (
      <section className="empty-compare">
        <GitCompareArrows size={36} />
        <span className="eyebrow">NO LOCAL DESIGNS</span>
        <h1>Save at least two wing studies to compare them.</h1>
        <p>Designs stay in this browser. WingLab does not upload or rank them.</p>
        <Link href="/simulator" className="button button-primary button-large">
          Open simulator <ArrowRight size={17} />
        </Link>
      </section>
    );
  }

  return (
    <main className="content-page compare-page">
      <section className="page-hero compact">
        <span className="eyebrow">SIDE-BY-SIDE TRADE STUDY</span>
        <h1>Compare without declaring a winner.</h1>
        <p>
          Differences are descriptive. A design choice still depends on mission,
          structure, controls, propulsion, manufacturing, and coefficient quality.
        </p>
      </section>

      <section className="compare-picker">
        <div>
          <h2>Designs in view</h2>
          <p>Select up to four locally saved studies.</p>
        </div>
        <div className="picker-options">
          {designs.map((design) => {
            const checked = selected.includes(design.id);
            return (
              <label key={design.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selected.length >= 4}
                  onChange={() =>
                    setSelected((current) =>
                      checked ? current.filter((id) => id !== design.id) : [...current, design.id],
                    )
                  }
                />
                <span>{design.name}</span>
              </label>
            );
          })}
        </div>
      </section>

      {shown.length > 0 && (
        <>
          <section className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {shown.map((design, index) => (
                    <th key={design.id}>
                      <span>{design.name}</span>
                      <Badge tone={index === 0 ? "cyan" : "neutral"}>
                        {index === 0 ? "Baseline" : design.input.planform}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => {
                  const baselineValue = baseline ? metric.value(baseline) : 0;
                  return (
                    <tr key={metric.label}>
                      <th>{metric.label}<small>{metric.unit}</small></th>
                      {shown.map((design, index) => {
                        const value = metric.value(design);
                        const absolute = value - baselineValue;
                        const percent = baselineValue === 0 ? 0 : (absolute / baselineValue) * 100;
                        return (
                          <td key={design.id}>
                            <strong>{formatted(value)}</strong>
                            {index > 0 && (
                              <span className={absolute >= 0 ? "delta-positive" : "delta-negative"}>
                                {absolute >= 0 ? "+" : ""}{formatted(absolute)} · {percent >= 0 ? "+" : ""}{percent.toFixed(1)}%
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="tradeoff-grid">
            <article><span>01</span><h3>Wing loading</h3><p>Lower wing loading may reduce estimated stall speed, but is not a structural or gust-response conclusion.</p></article>
            <article><span>02</span><h3>Aspect ratio</h3><p>Higher aspect ratio may reduce induced drag when CL and Oswald efficiency are comparable.</p></article>
            <article><span>03</span><h3>Wing area</h3><p>More area can increase lift at fixed CL and speed, while also affecting structural size and parasitic drag.</p></article>
            <article><span>04</span><h3>Mass</h3><p>Lower mass improves wing loading, but WingLab does not evaluate strength, durability, or payload needs.</p></article>
          </section>
          <div className="comparison-note"><Info size={16} /> Percent differences inherit every assumption in each saved design. Compare like-for-like operating conditions where possible.</div>
        </>
      )}
    </main>
  );
}
