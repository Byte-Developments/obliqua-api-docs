"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PearLogo } from "../navigation/PearLogo";

// Blue field, a pear outline drawing itself, a hairline that tracks real loading progress.
// When everything is decoded and the first frames are rendered, the screen opens vertically.

export function PageLoader({ progress, done, onOpened }: { progress: number; done: boolean; onOpened: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (!done || opened.current) return;
    opened.current = true;
    const el = root.current!;
    const tl = gsap.timeline({ onComplete: () => { el.style.display = "none"; } });
    tl.to(el.querySelector(".loader-mark"), { scale: 0.86, duration: 0.6, ease: "power3.inOut" })
      .to(el.querySelectorAll(".loader-meta"), { opacity: 0, duration: 0.3, ease: "power2.out" }, "<")
      .to(el.querySelector(".loader-top"), { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.1")
      .to(el.querySelector(".loader-bottom"), { yPercent: 100, duration: 1.1, ease: "expo.inOut" }, "<")
      .to(el.querySelector(".loader-mark"), { opacity: 0, duration: 0.35, ease: "power2.out" }, "<")
      .add(onOpened, "-=0.75");
  }, [done, onOpened]);

  return (
    <div ref={root} className="fixed inset-0 z-[70] text-paper" role="status" aria-live="polite">
      <div className="loader-top absolute inset-x-0 top-0 h-1/2 bg-cobalt" />
      <div className="loader-bottom absolute inset-x-0 bottom-0 h-1/2 bg-cobalt" />
      <div className="loader-mark absolute inset-0 flex flex-col items-center justify-center gap-7">
        <PearLogo size={44} strokeWidth={1.1} className="loader-draw" />
        <div className="loader-meta label opacity-90">PEAR / CULTIVATING EXPERIENCE</div>
        <div className="loader-meta relative h-px w-40 bg-white/20 overflow-hidden">
          <span className="absolute inset-0 origin-left bg-white transition-transform duration-300 ease-out" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </div>
  );
}
