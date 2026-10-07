"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { PearModel, PEAR_SCALE } from "./three/PearModel";
import { createPearUniforms } from "./three/HalftoneMaterial";
import { PearLogo } from "./navigation/PearLogo";
import { IMAGES, imageUrl, DRAWINGS, type ImageKey } from "@/lib/imageManifest";
import { loadAssets, type Assets } from "@/lib/assets";

// prefers-reduced-motion: the same story as still photographs and short dissolves. No pinned
// scroll, no camera travel; the monument pear is a single still render.

function Dissolve({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.2 });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-opacity duration-700 ${seen ? "opacity-100" : "opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

function Photo({ k, children, dark = false }: { k: ImageKey; children?: ReactNode; dark?: boolean }) {
  const e = IMAGES[k];
  return (
    <section className="relative h-[100svh] overflow-hidden" style={{ background: e.tone }}>
      <img
        src={imageUrl(k, false)}
        alt={e.alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: `${e.focus[0] * 100}% ${(1 - e.focus[1]) * 100}%` }}
        loading="lazy"
      />
      <Dissolve className={`frame relative h-full ${dark ? "text-ink" : "text-paper shadow-soft"}`}>{children}</Dissolve>
    </section>
  );
}

function StillPear() {
  const [assets, setAssets] = useState<Assets | null>(null);
  const [uniforms] = useState(() => {
    const u = createPearUniforms();
    u.uMorph.value = 1;
    return u;
  });
  useEffect(() => {
    loadAssets(window.innerWidth < 768, () => {}).then(setAssets);
  }, []);
  return (
    <Canvas frameloop="demand" flat dpr={[1, 1.5]} camera={{ fov: 35, position: [-4, 3, 34] }} onCreated={({ camera }) => camera.lookAt(-1, 6.2, 0)}>
      <color attach="background" args={["#0865F4"]} />
      <Environment resolution={64} frames={1}>
        <color attach="background" args={["#0865F4"]} />
        <Lightformer form="rect" intensity={2.2} color="#fff7ea" position={[-6, 8, 6]} scale={[10, 6, 1]} />
      </Environment>
      <hemisphereLight args={["#e6efff", "#0a4fc4", 0.75]} />
      <directionalLight position={[-12, 18, 14]} intensity={2.6} color="#fff1dc" />
      {assets && (
        <group position={[0, 2.2 * PEAR_SCALE, 0]} scale={PEAR_SCALE} rotation={[-0.03, 0.6, 0.025]}>
          <PearModel assets={assets} uniforms={uniforms} detail="low" />
        </group>
      )}
    </Canvas>
  );
}

export function ReducedExperience() {
  return (
    <main className="bg-gallery text-ink">
      <header className="fixed left-5 top-5 z-40 flex items-center gap-2.5 text-paper mix-blend-difference">
        <PearLogo size={18} />
        <span className="label !tracking-[0.32em]">PEAR</span>
      </header>

      <section className="relative h-[100svh] overflow-hidden bg-cobalt text-paper">
        <div className="curtain-static absolute right-0 top-0 h-full w-[22%]" aria-hidden="true" />
        <img
          src={imageUrl("hero", false)}
          alt={IMAGES.hero.alt}
          className="absolute bottom-0 right-[16%] h-[88%] w-auto object-contain"
        />
        <div className="frame relative h-full">
          <div className="absolute left-0 md:left-[8.333%] top-[18vh] md:top-[29vh]">
            <p className="label mb-8 opacity-80">Nº 01 — Appearance</p>
            <h1 className="font-serif text-[clamp(52px,6.5vw,118px)] leading-[0.92] tracking-[-0.045em]">
              Pear makes
              <br />
              you <em className="italic">appear.</em>
            </h1>
            <p className="mt-10 text-[15px] leading-[1.45] text-paper/85">
              Not a fruit on the shelf.
              <br />A presence in the optic.
            </p>
          </div>
        </div>
      </section>

      <Photo k="pruning" dark>
        <div className="absolute left-0 md:left-[8.333%] bottom-[12vh]">
          <p className="label mb-4 opacity-70">03 — Cultivation</p>
          <h2 className="font-serif text-[clamp(30px,2.9vw,52px)] leading-[0.98]">The first cut <em>is a promise.</em></h2>
        </div>
      </Photo>
      <Photo k="orchard">
        <div className="absolute left-0 md:left-[8.333%] top-[22vh]">
          <h2 className="font-serif text-[clamp(40px,4.6vw,84px)] leading-[0.94]">
            Grown slowly,
            <br />
            <em>on purpose.</em>
          </h2>
        </div>
      </Photo>
      <Photo k="reach" />
      <Photo k="portrait" dark>
        <div className="absolute left-0 md:left-[8.333%] top-[16vh] md:top-[30vh] max-w-[36ch]">
          <h2 className="font-serif text-[clamp(40px,4.6vw,84px)] leading-[0.94]">
            We give it
            <br />
            <em>what it earns.</em>
          </h2>
          <p className="mt-8 text-[13px] leading-[1.55] text-ink/75">
            Every pear is chosen by hand, turned toward the light and held a moment longer than necessary. Patience is the only
            ingredient we refuse to measure.
          </p>
        </div>
      </Photo>
      <Photo k="cutting" dark />
      <Photo k="halves" dark />

      <section className="relative h-[100svh] bg-cobalt text-paper">
        <Dissolve className="frame relative h-full">
          <div className="absolute left-0 md:left-[33%] top-[40vh]">
            <h2 className="font-serif text-[clamp(30px,2.9vw,52px)] leading-[0.98]">
              The ordinary fruit,
              <br />
              <em>reconsidered.</em>
            </h2>
          </div>
          <div className="absolute right-0 md:right-[8.333%] top-[18vh] max-w-[340px]">
            <h3 className="font-serif text-[clamp(22px,1.8vw,32px)] leading-[1.02]">Everything it takes to be seen, under one roof.</h3>
            <p className="mt-5 text-[12px] leading-[1.55] text-paper/80">
              Cultivation, curation, ceremony. We treat the ordinary fruit as a material for attention.
            </p>
          </div>
        </Dissolve>
      </section>

      <section className="relative h-[100svh] bg-cobalt text-paper" aria-label="A monumental golden pear beside a robed figure for scale">
        <StillPear />
        <div className="frame pointer-events-none absolute inset-0">
          <div className="absolute right-0 md:right-[8.333%] top-[16vh] max-w-[330px]">
            <h2 className="font-serif text-[clamp(22px,1.8vw,32px)] leading-[1.02]">
              We shape what others <em>simply consume.</em>
            </h2>
            <p className="mt-5 text-[12px] leading-[1.55] text-paper/85">
              From orchard to object, every part of the pear is considered as material, symbol and experience.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/10">
        {(Object.keys(DRAWINGS) as (keyof typeof DRAWINGS)[]).map((k) => (
          <div key={k} className="bg-[#F1EBDD] p-8 md:p-16">
            <img src={DRAWINGS[k]} alt={`Architectural drawing: ${k}`} className="mx-auto w-full max-w-[520px]" loading="lazy" />
          </div>
        ))}
      </section>

      <footer className="relative h-[100svh] bg-gallery">
        <Dissolve className="frame relative h-full">
          <h2 className="absolute left-0 md:left-[8.333%] top-[28vh] font-serif text-[clamp(40px,4.6vw,84px)] leading-[0.94]">
            Perfectly ordinary.
            <br />
            <em>Entirely considered.</em>
          </h2>
          <div className="absolute left-0 md:left-[8.333%] bottom-[20vh] flex items-center gap-4">
            <PearLogo size={26} strokeWidth={1.2} />
            <span className="font-serif text-[clamp(44px,5vw,88px)] leading-none">PEAR</span>
          </div>
          <a href="#" className="absolute right-0 md:right-[8.333%] bottom-[21vh] border-b border-ink/40 pb-1 text-[13px]">
            Discover the orchard →
          </a>
        </Dissolve>
      </footer>
    </main>
  );
}
