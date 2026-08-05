# WingLab

WingLab is an interactive educational wing-analysis application for students,
hobbyists, and early-stage aerospace engineers. It combines exact planform
geometry with transparent, low-speed aerodynamic estimates. It is intentionally
not CFD, a stability solver, a structural analysis package, or a
flight-certification tool.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The development server prints its local URL.

Quality commands:

```bash
npm run test
npm run lint
npm run build
```

## Technology

- Next.js App Router through the vinext Cloudflare-compatible runtime
- React and TypeScript
- Tailwind CSS with local shadcn-style UI primitives
- React Hook Form and Zod
- Recharts
- Lucide icons
- KaTeX
- Vitest
- `localStorage` for browser-local designs

No backend, database, account, or external API is required for the MVP.

## Product routes

- `/` — product overview and model boundaries
- `/simulator` — geometry, condition, visualization, performance, saving, JSON,
  and print/PDF workflow
- `/compare` — comparison of locally saved studies
- `/validation` — formula reference, numerical tolerances, and benchmark outputs
- `/methodology` — equations, coefficient policy, confidence system, and limits

## Formula list

All calculations are performed internally in SI units.

- Weight: `W = m g`
- Rectangular area: `S = b c`
- Tapered area: `S = b (cr + ct) / 2`
- Aspect ratio: `AR = b² / S`
- Mean aerodynamic chord:
  `MAC = (2/3) cr (1 + λ + λ²) / (1 + λ)`
- Reynolds number: `Re = ρ V MAC / μ`
- Dynamic pressure: `q = 0.5 ρ V²`
- Lift: `L = q S CL`
- Required lift coefficient: `CLrequired = W / (q S)`
- Estimated one-g stall speed: `Vs = sqrt(2W / (ρ S CLmax))`
- Induced drag coefficient: `CDi = CL² / (π e AR)`
- Total drag coefficient: `CD = CD0 + CDi`
- Drag: `D = q S CD`
- Lift-to-drag ratio: `CL/CD`, checked against `L/D`
- Idealized glide angle: `atan(D/L)`
- Educational linear lift model: `CL = CL0 + a α`, capped at `CLmax`

## Model assumptions

- Aerodynamic coefficients are supplied by the user or selected from educational
  examples. Geometry alone is never presented as an airfoil-polar prediction.
- Standard-atmosphere mode uses a tropospheric ISA pressure relation,
  user-entered temperature, Sutherland viscosity, and temperature-based speed of
  sound.
- The drag model is a simplified parabolic polar.
- Stall speed is a one-g, steady-flight estimate dominated by the quality of
  `CLmax`.
- The speed charts hold their stated inputs constant. The level-flight drag
  charts solve required CL at each speed and mark the below-stall region as
  unsupported.

## Validation strategy

The calculation core is independent of React. Vitest covers direct numerical
benchmarks, scaling relationships, force/coefficient consistency, conversion
round trips, atmospheric reference behavior, invalid physical inputs, division
by zero prevention, and finite outputs. The `/validation` route publishes the
same benchmark assumptions and numerical tolerances used by the test suite.

## Known limitations

WingLab does not model:

- post-stall flow or dynamic stall
- gusts, turns, ground effect, or propeller slipstream
- control-surface deflection
- structural deformation, loads, or safety
- aircraft stability or controllability
- detailed airfoil pressure fields or boundary-layer transition
- compressibility corrections above the low-speed subsonic envelope
- wind, trim losses, pilot technique, or real-world glide range

A wing producing sufficient theoretical lift does not guarantee stable,
controllable, structurally safe, or flight-ready behavior.

## Future improvements

- import of user-supplied airfoil polar data with provenance
- additional atmosphere layers and humidity treatment
- sensitivity bands for coefficient ranges
- mission-specific comparison views
- optional persistence export/import bundles
- higher-fidelity whole-aircraft drag accounting

