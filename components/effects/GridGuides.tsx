"use client";

import { useEffect, useRef } from "react";
import { addDriver } from "@/lib/store";
import { smoothstep } from "@/lib/animation";

// Hairline print guides: a 12-column grid at a few percent opacity, small crosshairs at some
// intersections and coordinate labels — only in the scenes that are "editorial".

export function GridGuides({
  at,
  tone,
  cols = [1, 4, 7, 10],
  crosses = [],
  labels = [],
}: {
  at: [number, number, number, number];
  tone: "light" | "dark";
  cols?: number[];
  crosses?: [number, number][];
  labels?: { x: number; y: number; text: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    return addDriver((s) => {
      const o = Math.min(smoothstep(at[0], at[1], s.t), 1 - smoothstep(at[2], at[3], s.t)) * Math.min(1, s.intro * 2);
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o <= 0.001 ? "hidden" : "visible";
    });
  }, [at]);
  const line = tone === "light" ? "bg-white/[0.09]" : "bg-black/[0.08]";
  const ink = tone === "light" ? "text-paper/55" : "text-ink/45";
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 hidden md:block" style={{ visibility: "hidden" }} aria-hidden="true">
      <div className="frame relative h-full">
        {cols.map((c) => (
          <span key={c} className={`absolute top-0 bottom-0 w-px ${line}`} style={{ left: `${(c / 12) * 100}%` }} />
        ))}
        <span className={`absolute left-0 right-0 h-px ${line}`} style={{ top: "18%" }} />
        <span className={`absolute left-0 right-0 h-px ${line}`} style={{ top: "82%" }} />
        {crosses.map(([x, y], i) => (
          <span key={i} className={`cross absolute ${ink}`} style={{ left: `${(x / 12) * 100}%`, top: `${y}%` }} />
        ))}
        {labels.map((l, i) => (
          <span key={i} className={`label absolute !text-[9px] ${ink}`} style={{ left: `calc(${(l.x / 12) * 100}% + 6px)`, top: `calc(${l.y}% + 6px)` }}>
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
}
