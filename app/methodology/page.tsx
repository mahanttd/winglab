import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert, Layers3, Scale, Wind } from "lucide-react";
import { Equation } from "@/components/Equation";
import { PageFooter } from "@/components/PageFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Methodology",
  description: "The equations, assumptions, confidence system, and scientific limits behind WingLab.",
};

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-page methodology-page">
        <section className="page-hero compact">
          <span className="eyebrow">METHOD, ASSUMPTIONS & LIMITS</span>
          <h1>A model is useful when its boundaries stay visible.</h1>
          <p>
            WingLab combines exact geometry with preliminary aerodynamic estimates. It does not
            infer an airfoil polar, solve a flow field, or determine whether an aircraft is safe.
          </p>
        </section>

        <nav className="method-toc" aria-label="Methodology sections">
          <a href="#calculated">What is calculated</a>
          <a href="#coefficients">Coefficient inputs</a>
          <a href="#stall">Stall</a>
          <a href="#drag">Drag model</a>
          <a href="#confidence">Confidence</a>
          <a href="#limits">Limits</a>
        </nav>

        <section id="calculated" className="method-section">
          <div className="method-index">01</div>
          <div className="method-copy">
            <span className="eyebrow">EXACT VS ESTIMATED</span>
            <h2>What WingLab calculates</h2>
            <p>
              Geometry is deterministic when dimensions are defined. Wing area, taper ratio,
              mean aerodynamic chord, aspect ratio, and wing loading follow directly from
              entered values and unit conversions.
            </p>
            <div className="equation-grid">
              <article><span>Rectangular area</span><Equation block>S=bc</Equation><small>Exact geometry</small></article>
              <article><span>Tapered area</span><Equation block>S=b(c_r+c_t)/2</Equation><small>Exact geometry</small></article>
              <article><span>Aspect ratio</span><Equation block>AR=b^2/S</Equation><small>Exact geometry</small></article>
              <article><span>Wing loading</span><Equation block>{"m/S \\quad\\text{and}\\quad W/S"}</Equation><small>Mass and weight kept distinct</small></article>
            </div>
            <p>
              Lift, drag, stall speed, and glide are estimates because their fidelity depends
              on aerodynamic coefficients and excluded aircraft effects.
            </p>
          </div>
        </section>

        <section id="coefficients" className="method-section">
          <div className="method-index">02</div>
          <div className="method-copy">
            <span className="eyebrow">USER-SUPPLIED AERODYNAMICS</span>
            <h2>Why geometry cannot determine CL by itself</h2>
            <p>
              CL and CLmax depend on airfoil shape, angle of attack, Reynolds number, surface
              condition, laminar-to-turbulent transition, separation, control deflection, and
              three-dimensional effects. WingLab therefore requires coefficients from the user
              or a clearly labeled educational preset.
            </p>
            <div className="method-callout">
              <CircleAlert />
              <div><strong>Manual mode</strong><p>Angle of attack is descriptive. The entered CL drives lift.</p></div>
            </div>
            <div className="method-callout">
              <Layers3 />
              <div><strong>Educational linear mode</strong><Equation>{"C_L=C_{L0}+a\\alpha"}</Equation><p>The user supplies CL0 and slope; α is converted to radians. CL is capped at CLmax and no post-stall curve is fabricated.</p></div>
            </div>
          </div>
        </section>

        <section id="stall" className="method-section">
          <div className="method-index">03</div>
          <div className="method-copy">
            <span className="eyebrow">ONE-G STEADY FLIGHT</span>
            <h2>Why stall is difficult to predict</h2>
            <Equation block>{"V_s=\\sqrt{\\frac{2W}{\\rho S C_{L,max}}}"}</Equation>
            <p>
              This rearranges the lift equation at CLmax. It is highly sensitive to whether
              CLmax is credible. It does not predict accelerated stalls in turns, dynamic
              pitching, gust response, hysteresis, control-surface effects, or separation
              progression.
            </p>
          </div>
        </section>

        <section id="drag" className="method-section">
          <div className="method-index">04</div>
          <div className="method-copy">
            <span className="eyebrow">PARABOLIC POLAR</span>
            <h2>Why the drag model is simplified</h2>
            <Equation block>{"C_D=C_{D0}+\\frac{C_L^2}{\\pi e AR}"}</Equation>
            <p>
              The induced term captures a classical finite-wing relationship. CD0 is a user
              input that may or may not include fuselage, landing gear, cooling, trim, surface,
              and interference drag. The model is useful for educational trends and preliminary
              trade studies—not high-fidelity performance prediction.
            </p>
            <div className="method-callout">
              <Wind />
              <div><strong>Speed sweeps</strong><p>The drag chart solves required CL at each speed for one-g level flight, then applies this polar. Below the estimated stall speed, that state is marked unsupported.</p></div>
            </div>
          </div>
        </section>

        <section id="confidence" className="method-section">
          <div className="method-index">05</div>
          <div className="method-copy">
            <span className="eyebrow">QUALITATIVE, NOT STATISTICAL</span>
            <h2>Confidence depends on input quality</h2>
            <p>
              WingLab does not show percentages because no probability distribution or
              validation dataset supports them. Its labels describe the dependency chain.
            </p>
            <div className="confidence-table">
              <div><Badge tone="green">High</Badge><span><strong>Defined geometry and conversions</strong>Direct calculations with traceable units.</span></div>
              <div><Badge tone="cyan">Medium</Badge><span><strong>Credible coefficient or environment input</strong>Physics-based estimate with a dominant declared uncertainty.</span></div>
              <div><Badge tone="amber">Low</Badge><span><strong>Generic coefficient or incomplete drag model</strong>Useful for trends, not precise prediction.</span></div>
            </div>
          </div>
        </section>

        <section id="limits" className="method-section">
          <div className="method-index">06</div>
          <div className="method-copy">
            <span className="eyebrow">OUTSIDE THE MODEL</span>
            <h2>Important scientific limitations</h2>
            <ol className="numbered-limitations">
              <li>WingLab does not replace wind-tunnel testing, CFD, professional analysis, or flight testing.</li>
              <li>It does not simulate transition, surface roughness, detailed separation, or airfoil pressure fields.</li>
              <li>It does not model dynamic stalls, gusts, turns, structural deformation, ground effect, propeller slipstream, or control deflection.</li>
              <li>It analyzes aerodynamic estimates, not structural safety, stability, or controllability.</li>
              <li>The low-speed formulation warns above approximately Mach 0.3; compressibility corrections are not included.</li>
              <li>Sufficient theoretical lift does not guarantee stable, controllable, or safe flight.</li>
            </ol>
            <div className="method-final">
              <Scale size={26} />
              <div><strong>Use WingLab to ask better questions.</strong><p>Then verify consequential decisions with source-quality coefficients, higher-fidelity analysis, testing, and qualified engineering review.</p></div>
            </div>
            <Link href="/simulator" className="button button-primary button-large">Open simulator <ArrowRight size={17} /></Link>
          </div>
        </section>
      </main>
      <PageFooter />
    </>
  );
}
