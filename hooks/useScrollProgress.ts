"use client";

import { useEffect } from "react";
import { addDriver } from "@/lib/store";
import { range } from "@/lib/animation";
import { T, type SceneId } from "@/lib/sceneConfig";

/**
 * Calls `onProgress(p)` every frame with the normalised 0..1 progress of a scene — the single
 * source of truth that scene animations derive from. No React state, no re-renders.
 */
export function useScrollProgress(scene: SceneId, onProgress: (p: number, t: number) => void) {
  useEffect(() => addDriver((s) => onProgress(range(s.t, T[scene][0], T[scene][1]), s.t)), [scene, onProgress]);
}
