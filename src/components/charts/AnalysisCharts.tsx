"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { createSpeedSeries } from "@/lib/chartData";
import type { WingAnalysis, WingInputSI } from "@/types/wing";

const tabs = [
  ["lift", "Lift vs speed"],
  ["drag", "Drag vs speed"],
  ["efficiency", "L/D vs speed"],
  ["cl", "Required CL"],
] as const;

export function AnalysisCharts({
  input,
  analysis,
}: {
  input: WingInputSI;
  analysis: WingAnalysis;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("lift");
  const data = useMemo(() => createSpeedSeries(input, analysis), [input, analysis]);
  const stall = analysis.performance.stallSpeedMS;
  const minDrag = data.reduce((best, point) => (point.dragN < best.dragN ? point : best), data[0]);
  const maxX = data[data.length - 1]?.speedMS ?? input.speedMS;
  const yKey =
    tab === "lift" ? "liftN" : tab === "drag" ? "dragN" : tab === "efficiency" ? "liftToDrag" : "requiredCL";
  const unit = tab === "lift" || tab === "drag" ? "N" : "";
  const title = tabs.find(([key]) => key === tab)?.[1] ?? "";

  return (
    <section className="chart-card" aria-labelledby="analysis-chart-title">
      <div className="chart-tabs" role="tablist" aria-label="Performance graphs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="chart-heading">
        <div>
          <span className="eyebrow">PARAMETRIC ESTIMATE</span>
          <h2 id="analysis-chart-title">{title}</h2>
        </div>
        <p>
          {tab === "lift" && "Density, wing area, and CL are held constant."}
          {tab === "drag" && "Simplified level-flight drag estimate."}
          {tab === "efficiency" && "Level-flight L/D using the simplified drag polar."}
          {tab === "cl" && "Required CL for one-g steady level flight."}
        </p>
      </div>
      <div className="chart-wrap" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 18, right: 22, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="var(--grid-line)" vertical={false} />
            <XAxis
              dataKey="speedMS"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => Number(value).toFixed(0)}
              stroke="var(--muted)"
              tickLine={false}
              label={{ value: "True airspeed (m/s)", position: "insideBottom", offset: -2 }}
            />
            <YAxis
              stroke="var(--muted)"
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(value) => Number(value).toFixed(tab === "cl" ? 1 : 0)}
              label={{ value: unit, angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--panel-strong)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
              formatter={(value) => [Number(value).toFixed(3), title]}
              labelFormatter={(value) => `${Number(value).toFixed(2)} m/s`}
            />
            <Legend />
            <ReferenceArea x1={data[0]?.speedMS} x2={stall} fill="var(--danger)" fillOpacity={0.08} />
            <ReferenceLine
              x={stall}
              stroke="var(--danger)"
              strokeDasharray="5 4"
              label={{ value: `Vs ${stall.toFixed(1)}`, fill: "var(--danger)", position: "insideTopRight" }}
            />
            {tab === "lift" && (
              <ReferenceLine
                y={analysis.performance.weightN}
                stroke="var(--amber)"
                strokeDasharray="4 4"
                label={{ value: "Aircraft weight", fill: "var(--amber)", position: "insideTopLeft" }}
              />
            )}
            {tab === "drag" && (
              <ReferenceLine
                x={minDrag.speedMS}
                stroke="var(--success)"
                strokeDasharray="4 4"
                label={{ value: "Minimum drag", fill: "var(--success)", position: "insideTopRight" }}
              />
            )}
            {tab === "cl" && (
              <ReferenceLine
                y={input.maxLiftCoefficient}
                stroke="var(--amber)"
                strokeDasharray="4 4"
                label={{ value: "CLmax", fill: "var(--amber)", position: "insideTopLeft" }}
              />
            )}
            <Line
              name={title}
              type="monotone"
              dataKey={yKey}
              stroke="var(--cyan)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              animationDuration={350}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">
        Shaded region is below the estimated one-g stall speed; steady level flight is not supported by this model there.
      </p>
      <p className="sr-only">
        {title} ranges from {Number(data[0]?.[yKey]).toFixed(2)} to {Number(data[data.length - 1]?.[yKey]).toFixed(2)} across {data[0]?.speedMS.toFixed(1)} to {maxX.toFixed(1)} meters per second. Estimated stall speed is {stall.toFixed(1)} meters per second.
      </p>
    </section>
  );
}

