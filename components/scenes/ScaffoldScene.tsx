"use client";

import { useEffect, useRef } from "react";
import { SceneCopy } from "../typography/SceneCopy";
import { EditorialHeadline } from "../typography/EditorialHeadline";
import { SmallLabel } from "../typography/SmallLabel";
import { addDriver } from "@/lib/store";
import { range } from "@/lib/animation";
import { T } from "@/lib/sceneConfig";

// SCENE 14 — restoration in progress. Live counters follow the build.
function Counter({ from, to, total, label }: { from: number; to: number; total: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      addDriver((s) => {
        const p = range((s.t - T.scaffold[0]) / (T.scaffold[1] - T.scaffold[0]), from, to);
        if (ref.current) ref.current.textContent = String(Math.round(p * total)).padStart(2, "0");
      }),
    [from, to, total]
  );
  return (
    <span className="flex gap-2">
      <span className="opacity-60">{label}</span>
      <span ref={ref} className="tabular-nums">00</span>
      <span className="opacity-40">/ {String(total).padStart(2, "0")}</span>
    </span>
  );
}

export function ScaffoldScene() {
  return (
    <SceneCopy at={[1150, 1176, 1272, 1292]} className="absolute inset-0 text-paper">
      <div className="frame relative h-full">
        <div className="absolute left-0 md:left-[8.333%] top-[18vh] md:top-[20vh]">
          <SmallLabel className="mb-5 text-paper/70">13 — Restoration in progress</SmallLabel>
          <EditorialHeadline size="sm" lines={["Ordinary things,", <em key="e" className="italic">built like monuments.</em>]} />
        </div>
        <SmallLabel className="absolute left-0 md:left-[8.333%] bottom-7 md:bottom-9 text-paper/80 flex flex-col gap-1.5">
          <Counter from={0.2} to={0.45} total={52} label="Poles" />
          <Counter from={0.5} to={0.8} total={6} label="Platforms" />
          <Counter from={0.6} to={0.85} total={3} label="Hands" />
        </SmallLabel>
      </div>
    </SceneCopy>
  );
}
