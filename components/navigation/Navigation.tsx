"use client";

import { useEffect, useRef, useState } from "react";
import { PearLogo } from "./PearLogo";
import { addDriver } from "@/lib/store";
import { CHAPTERS, chapterAt, themeAt } from "@/lib/sceneConfig";
import { scrollToUnits, lockScroll } from "@/lib/scroll";

// Almost invisible UI: a mark, a rail, one action. It re-inks itself for every scene.

export function Navigation() {
  const root = useRef<HTMLDivElement>(null);
  const chapterN = useRef<HTMLSpanElement>(null);
  const chapterTitle = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let lastTheme = "";
    let lastIdx = -1;
    return addDriver((s) => {
      const theme = themeAt(s.t);
      if (theme !== lastTheme && root.current) {
        root.current.dataset.theme = theme;
        lastTheme = theme;
      }
      const idx = chapterAt(s.t);
      if (idx !== lastIdx) {
        lastIdx = idx;
        if (chapterN.current) chapterN.current.textContent = CHAPTERS[idx].n;
        if (chapterTitle.current) chapterTitle.current.textContent = CHAPTERS[idx].title;
      }
      if (bar.current) bar.current.style.transform = `scaleY(${Math.min(1, Math.max(0, s.t / 1445)).toFixed(4)})`;
    });
  }, []);

  useEffect(() => {
    lockScroll(open);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (at: number) => {
    setOpen(false);
    requestAnimationFrame(() => scrollToUnits(at));
  };

  return (
    <>
      <div ref={root} data-theme="light" className="nav fixed inset-0 z-40 pointer-events-none">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            go(0);
          }}
          className="nav-ink pointer-events-auto absolute left-5 top-5 md:left-8 md:top-7 flex items-center gap-2.5"
          data-cursor="hover"
          aria-label="PEAR — back to the beginning"
        >
          <PearLogo size={18} />
          <span className="label !tracking-[0.32em]">PEAR</span>
        </a>

        <button
          type="button"
          className="nav-ink pointer-events-auto absolute right-5 top-5 md:right-8 md:top-7 label flex items-center gap-2 border-b border-current pb-1"
          data-cursor="hover"
          onClick={() => go(1445)}
        >
          Apply <span aria-hidden="true">+</span>
        </button>

        {/* left rail */}
        <div className="nav-ink absolute left-5 md:left-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pointer-events-auto flex h-8 w-8 flex-col items-center justify-center gap-[5px]"
            aria-label="Open chapter index"
            aria-expanded={open}
            data-cursor="hover"
          >
            <span className="block h-px w-4 bg-current" />
            <span className="block h-px w-4 bg-current" />
          </button>
          <span className="relative block h-24 w-px bg-current/20 overflow-hidden">
            <span ref={bar} className="absolute inset-0 origin-top bg-current" style={{ transform: "scaleY(0)" }} />
          </span>
          <span className="label [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
            <span ref={chapterN}>01</span> — <span ref={chapterTitle}>Appearance</span>
          </span>
        </div>

        {/* mobile menu trigger */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="nav-ink md:hidden pointer-events-auto absolute right-5 bottom-5 flex h-8 w-8 flex-col items-center justify-center gap-[5px]"
          aria-label="Open chapter index"
        >
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
        </button>
      </div>

      {/* chapter index */}
      <div
        className={`fixed inset-0 z-50 bg-cobalt text-paper transition-[clip-path] duration-700 ease-[cubic-bezier(.76,0,.24,1)] ${open ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_0_100%_0)] pointer-events-none"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Chapter index"
        aria-hidden={!open}
      >
        <div className="absolute left-5 top-5 md:left-8 md:top-7 flex items-center gap-2.5">
          <PearLogo size={18} />
          <span className="label !tracking-[0.32em]">PEAR / INDEX</span>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="label absolute right-5 top-5 md:right-8 md:top-7 border-b border-current pb-1" data-cursor="hover" tabIndex={open ? 0 : -1}>
          Close ×
        </button>
        <ol className="absolute left-5 right-5 bottom-10 md:left-[12vw] md:right-auto md:bottom-16 grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-1">
          {CHAPTERS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => go(c.at)}
                className="group flex items-baseline gap-4 py-1 text-left"
                data-cursor="hover"
              >
                <span className="label opacity-60">{c.n}</span>
                <span className="font-serif text-[clamp(22px,2.2vw,36px)] leading-tight tracking-[-0.02em] transition-[font-style] group-hover:italic">{c.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="label absolute right-5 md:right-8 bottom-5 opacity-60 hidden md:block">The ordinary fruit, reconsidered.</p>
      </div>
    </>
  );
}
