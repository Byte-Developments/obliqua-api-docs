"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navigation } from "./navigation/Navigation";
import { PageLoader } from "./effects/PageLoader";
import { Grain } from "./effects/Grain";
import { Cursor } from "./effects/Cursor";
import { HeroScene } from "./scenes/HeroScene";
import { FabricTransition } from "./scenes/FabricTransition";
import { OrchardScene } from "./scenes/OrchardScene";
import { PortraitScene } from "./scenes/PortraitScene";
import { PearSplitScene } from "./scenes/PearSplitScene";
import { BlueWorldScene } from "./scenes/BlueWorldScene";
import { MonumentPearScene } from "./scenes/MonumentPearScene";
import { ScaffoldScene } from "./scenes/ScaffoldScene";
import { BlueprintScene } from "./scenes/BlueprintScene";
import { ReducedExperience } from "./ReducedExperience";
import { loadAssets, type Assets } from "@/lib/assets";
import { startScroll, measure, unitsToPx, lockScroll, scrollToUnits } from "@/lib/scroll";
import { CHAPTERS, T } from "@/lib/sceneConfig";
import { state } from "@/lib/store";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const ExperienceCanvas = dynamic(() => import("./three/ExperienceCanvas"), { ssr: false });

export function Experience() {
  const reduced = useReducedMotion();
  const [assets, setAssets] = useState<Assets | null>(null);
  const [progress, setProgress] = useState(0);
  const [rendered, setRendered] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (reduced !== false) return;
    measure();
    setMounted(true);
    lockScroll(true);
    const stop = startScroll({ smooth: true });
    document.fonts?.ready.then(() => setFontsReady(true));
    loadAssets(state.isMobile, setProgress).then(setAssets);
    if (new URLSearchParams(window.location.search).has("debug")) {
      // inspection hook for visual QA: jump to any moment of the film
      (window as unknown as { __pear: unknown }).__pear = { state, go: (t: number) => scrollToUnits(t, true) };
    }

    // ScrollTrigger marks which scenes are live on <html data-scenes>, for styling hooks and
    // assistive context; the film itself reads the shared timeline value.
    const live = new Set<string>();
    const triggers = CHAPTERS.map((c) =>
      ScrollTrigger.create({
        start: () => unitsToPx(T[c.id][0]),
        end: () => unitsToPx(T[c.id][1]),
        onToggle: (self) => {
          if (self.isActive) live.add(c.id);
          else live.delete(c.id);
          document.documentElement.dataset.scenes = [...live].join(" ");
        },
      })
    );
    return () => {
      triggers.forEach((t) => t.kill());
      stop();
    };
  }, [reduced]);

  const onReady = useCallback(() => setRendered(true), []);
  const onOpened = useCallback(() => {
    lockScroll(false);
    state.ready = true;
    gsap.to(state, { intro: 1, duration: 1.6, ease: "power2.out" });
  }, []);

  if (reduced === null) return null;
  if (reduced) return <ReducedExperience />;

  const done = !!assets && rendered && fontsReady;

  return (
    <>
      <main id="top" className="relative">
        {mounted && <ExperienceCanvas assets={assets} onReady={onReady} />}

        <div className="fixed inset-0 z-10 pointer-events-none select-text">
          <HeroScene />
          <FabricTransition />
          <OrchardScene />
          <PortraitScene />
          <PearSplitScene />
          <BlueWorldScene />
          <MonumentPearScene />
          <ScaffoldScene />
          <BlueprintScene />
        </div>

        {/* the scroll track: the film's length, nothing else */}
        <div className="relative z-0" style={{ height: "var(--track, 1545lvh)" }} aria-hidden="true" />
      </main>
      <Navigation />
      <Cursor />
      <Grain />
      <PageLoader progress={progress} done={done} onOpened={onOpened} />
    </>
  );
}
