import type { SavedDesign } from "@/types/wing";

export const STORAGE_KEY = "winglab.designs.v1";

export function loadDesigns(): SavedDesign[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SavedDesign[]).slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function persistDesigns(designs: SavedDesign[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(designs.slice(0, 8)));
}

