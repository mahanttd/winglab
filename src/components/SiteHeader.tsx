"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  FlaskConical,
  FolderOpen,
  Moon,
  Plus,
  Save,
  Sun,
} from "lucide-react";
import type { UnitSystem } from "@/types/wing";
import { Button } from "./ui/button";

export function SiteHeader({ simulator = false }: { simulator?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [units, setUnits] = useState<UnitSystem>("si");
  const unitSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("winglab.theme");
    const nextTheme =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.dataset.units = "si";
    const frame = window.requestAnimationFrame(() => setTheme(nextTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const select = unitSelectRef.current;
    if (!select) return;
    const handleUnits = () => {
      const value = select.value as UnitSystem;
      setUnits(value);
      document.documentElement.dataset.units = value;
    };
    select.addEventListener("change", handleUnits);
    const interval = window.setInterval(() => {
      if (select.value !== document.documentElement.dataset.units) handleUnits();
    }, 150);
    return () => {
      select.removeEventListener("change", handleUnits);
      window.clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("winglab.theme", next);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="WingLab home">
          <span className="wordmark-mark" aria-hidden="true">
            <FlaskConical size={17} />
          </span>
          <span>WingLab</span>
          <span className="wordmark-tag">AERO</span>
        </Link>

        <nav className="main-nav" aria-label="Primary navigation">
          <Link href="/simulator">Simulator</Link>
          <Link href="/compare">Compare</Link>
          <Link href="/validation">Validation</Link>
          <Link href="/methodology">Methodology</Link>
        </nav>

        <div className="header-actions">
          {simulator && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.dispatchEvent(new Event("winglab:new"))}
              >
                <Plus size={15} /> New <span className="hide-tablet">design</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.dispatchEvent(new Event("winglab:save"))}
              >
                <Save size={15} /> Save
              </Button>
              <a className="button button-ghost button-sm" href="#saved-designs">
                <FolderOpen size={15} /> Load
              </a>
              <label className="unit-select">
                <span className="sr-only">Unit system</span>
                <select
                  ref={unitSelectRef}
                  aria-label="Unit system"
                  value={units}
                  onChange={() => undefined}
                >
                  <option value="si">SI units</option>
                  <option value="imperial">Imperial</option>
                </select>
                <ChevronDown size={13} aria-hidden="true" />
              </label>
            </>
          )}
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link
            href="/methodology"
            className="button button-secondary button-sm about-button"
          >
            <BookOpen size={15} /> About model
          </Link>
        </div>
      </div>
    </header>
  );
}
