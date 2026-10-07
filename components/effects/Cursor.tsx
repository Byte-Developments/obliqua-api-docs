"use client";

import { useEffect, useRef } from "react";
import { addDriver } from "@/lib/store";
import { T } from "@/lib/sceneConfig";

// A small dot that grows over interactive things and, in two moments of the film only,
// whispers what to do. Absent on touch devices.

function labelAt(t: number) {
  if (t > T.reach[0] + 28 && t < T.reach[1] - 6) return "Pick";
  if (t > T.blueprint[0] + 50 && t < T.blueprint[1] - 6) return "Explore";
  return "";
}

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = dot.current!;
    el.style.display = "flex";
    let hover = false;
    let x = -100, y = -100, size = 6, lastLabel = "";
    const over = (e: Event) => {
      hover = !!(e.target as HTMLElement).closest?.("a, button, [data-cursor='hover']");
    };
    window.addEventListener("pointerover", over, { passive: true });
    const off = addDriver((s) => {
      x += (s.pointer.px - x) * 0.25;
      y += (s.pointer.py - y) * 0.25;
      const label = labelAt(s.t);
      if (label !== lastLabel && text.current) {
        text.current.textContent = label;
        lastLabel = label;
      }
      const target = label ? 64 : hover ? 34 : 6;
      size += (target - size) * 0.18;
      el.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
      el.style.width = el.style.height = `${size.toFixed(2)}px`;
      el.dataset.mode = label ? "label" : hover ? "hover" : "dot";
    });
    return () => {
      off();
      window.removeEventListener("pointerover", over);
    };
  }, []);

  return (
    <div ref={dot} className="cursor" aria-hidden="true" style={{ display: "none" }}>
      <span ref={text} className="label !text-[9px]" />
    </div>
  );
}
