import Link from "next/link";

export function PageFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>WingLab</strong>
        <p>Preliminary aerodynamic estimates with assumptions in view.</p>
      </div>
      <div className="footer-links">
        <Link href="/methodology">Methodology</Link>
        <Link href="/validation">Validation</Link>
        <span>Not CFD · Not a certification tool</span>
      </div>
    </footer>
  );
}

