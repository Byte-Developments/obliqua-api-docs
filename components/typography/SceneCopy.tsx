"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { addDriver, state } from "@/lib/store";
import { clamp, ease, smoothstep } from "@/lib/animation";

// A block of copy that lives inside one window of the film: lines rise out of a mask on the
// way in, the block drifts up and dissolves on the way out. Fully scrubbed, so it reverses.

export type Window4 = [number, number, number, number];

export function SceneCopy({
  at,
  className = "",
  style,
  children,
  as: Tag = "div",
  drift = 40,
}: {
  at: Window4;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  as?: "div" | "section" | "header" | "footer";
  drift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current!;
    const lines = Array.from(root.querySelectorAll<HTMLElement>("[data-line]"));
    const fades = Array.from(root.querySelectorAll<HTMLElement>("[data-fade]"));
    let lastKey = "";
    return addDriver((s) => {
      const t = s.t;
      const intro = state.intro;
      const inK = smoothstep(at[0], at[1], t);
      const outK = smoothstep(at[2], at[3], t);
      const key = inK.toFixed(4) + outK.toFixed(4) + intro.toFixed(3);
      if (key === lastKey) return;
      lastKey = key;
      const hidden = inK <= 0 || outK >= 1 || intro <= 0;
      root.style.visibility = hidden ? "hidden" : "visible";
      if (hidden) return;
      root.style.opacity = String(1 - outK);
      root.style.transform = `translate3d(0, ${(-outK * drift).toFixed(2)}px, 0)`;
      const n = lines.length;
      lines.forEach((el, i) => {
        const stagger = 0.18;
        const k = Math.min(
          clamp(inK * (1 + stagger * (n - 1)) - i * stagger),
          clamp(intro * (1 + stagger * (n - 1)) - i * stagger)
        );
        el.style.transform = `translate3d(0, ${((1 - ease.power3Out(k)) * 110).toFixed(2)}%, 0)`;
      });
      fades.forEach((el, i) => {
        const k = Math.min(clamp(inK * 1.4 - 0.25 - i * 0.08), clamp(intro * 1.4 - 0.3 - i * 0.08));
        el.style.opacity = String(ease.power2Out(k));
        el.style.transform = `translate3d(0, ${((1 - ease.power3Out(k)) * 14).toFixed(2)}px, 0)`;
      });
    });
  }, [at, drift]);

  return (
    <Tag ref={ref} className={`scene-copy ${className}`} style={{ visibility: "hidden", ...style }}>
      {children}
    </Tag>
  );
}

/** One masked line of an editorial headline. */
export function Line({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`block overflow-hidden pb-[0.08em] -mb-[0.08em] ${className}`}>
      <span data-line className="block will-change-transform" style={{ transform: "translate3d(0,110%,0)" }}>
        {children}
      </span>
    </span>
  );
}

/** Secondary text that fades and lifts in after the lines. */
export function Fade({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "p" | "span" }) {
  return (
    <Tag data-fade className={className} style={{ opacity: 0 }}>
      {children}
    </Tag>
  );
}
