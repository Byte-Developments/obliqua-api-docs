"use client";

import { useEffect, useRef } from "react";
import { SceneCopy, Fade } from "../typography/SceneCopy";
import { EditorialHeadline } from "../typography/EditorialHeadline";
import { SmallLabel } from "../typography/SmallLabel";
import { PearLogo } from "../navigation/PearLogo";
import { addDriver } from "@/lib/store";
import { smoothstep } from "@/lib/animation";
import { T } from "@/lib/sceneConfig";
import { scrollToUnits } from "@/lib/scroll";

// SCENE 15 — plans, then quiet. The paper fills the frame and becomes the same warm white
// used in the gallery scenes; the last words sit in it, small.

export function BlueprintScene() {
  const paper = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      addDriver((s) => {
        const o = smoothstep(T.finale[0] + 2, T.finale[0] + 22, s.t);
        const el = paper.current!;
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o <= 0.001 ? "hidden" : "visible";
        el.style.pointerEvents = o > 0.9 ? "auto" : "none";
      }),
    []
  );

  return (
    <>
      <SceneCopy at={[1336, 1350, 1374, 1388]} className="absolute inset-0 text-ink">
        <div className="frame relative h-full">
          <SmallLabel className="absolute left-0 md:left-[8.333%] bottom-7 md:bottom-9 opacity-70">
            14 — Plans for an ordinary miracle
            <br />
            <span className="opacity-60">Sheet 01 of 04 · elevation · 1:50</span>
          </SmallLabel>
        </div>
      </SceneCopy>

      <div ref={paper} className="absolute inset-0 bg-gallery" style={{ visibility: "hidden", opacity: 0 }} />

      <SceneCopy at={[T.finale[0] + 14, T.finale[0] + 46, 99998, 99999]} className="absolute inset-0 text-ink" as="footer">
        <div className="frame relative h-full">
          <div className="absolute left-0 md:left-[8.333%] top-[22vh] md:top-[28vh]">
            <EditorialHeadline size="lg" lines={["Perfectly ordinary.", <em key="e" className="italic">Entirely considered.</em>]} />
          </div>
          <Fade className="absolute left-0 md:left-[8.333%] bottom-[22vh] md:bottom-[20vh] flex items-center gap-4">
            <PearLogo size={26} strokeWidth={1.2} />
            <span className="font-serif text-[clamp(44px,5vw,88px)] leading-none tracking-[0.02em]">PEAR</span>
          </Fade>
          <Fade className="absolute right-0 md:right-[8.333%] bottom-[22vh] md:bottom-[21vh] pointer-events-auto">
            <a
              href="#top"
              data-cursor="hover"
              onClick={(e) => {
                e.preventDefault();
                scrollToUnits(T.orchard[0] + 40);
              }}
              className="group inline-flex items-center gap-3 border-b border-ink/40 pb-1 text-[13px] tracking-[0.01em] hover:border-ink"
            >
              Discover the orchard <span className="transition-transform duration-500 group-hover:translate-x-1.5">→</span>
            </a>
          </Fade>
          <Fade className="absolute inset-x-0 bottom-6 md:bottom-8 flex flex-col md:flex-row justify-between gap-2 text-ink/50">
            <span className="label">© 2026 PEAR — a fictional fruit house</span>
            <span className="label">Pear makes you appear.</span>
          </Fade>
        </div>
      </SceneCopy>
    </>
  );
}
