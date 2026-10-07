"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { advance } from "@react-three/fiber";
import { END, MOBILE_SCALE } from "./sceneConfig";
import { runDrivers, state } from "./store";

// One clock for everything: GSAP's ticker drives Lenis, updates the shared store, runs the DOM
// drivers and then renders the WebGL frame. No competing requestAnimationFrame loops.

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let unitPx = 9; // px of scroll per timeline unit
let scale = 1;
let lastScroll = 0;
let canvasLive = false;

export const getLenis = () => lenis;
export const setCanvasLive = (v: boolean) => {
  canvasLive = v;
};

/** Stable "large" viewport height (ignores mobile URL-bar resizes). */
function measureLvh() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;height:100lvh;width:0;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const h = probe.offsetHeight || window.innerHeight;
  probe.remove();
  return h;
}

export function measure() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.aspect = state.width / state.height;
  state.isTouch = window.matchMedia("(pointer: coarse)").matches;
  state.isMobile = state.width < 768 || (state.isTouch && Math.min(state.width, state.height) < 820);
  scale = state.isMobile ? MOBILE_SCALE : 1;
  unitPx = (measureLvh() / 100) * scale;
  document.documentElement.style.setProperty("--track", `${(END * scale + 100).toFixed(2)}lvh`);
}

/** Scroll position (px) for a timeline value. */
export const unitsToPx = (t: number) => t * unitPx;

export function scrollToUnits(t: number, immediate = false) {
  const y = unitsToPx(t);
  if (lenis) lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 2.4, easing: (x) => 1 - Math.pow(1 - x, 4) });
  else window.scrollTo(0, y);
}

function readScroll() {
  const y = lenis ? lenis.animatedScroll : window.scrollY;
  state.t = y / unitPx;
  state.velocity = state.velocity * 0.85 + ((y - lastScroll) / unitPx) * 0.15;
  lastScroll = y;
}

function frame(time: number) {
  lenis?.raf(time * 1000);
  readScroll();
  state.time = time;
  const p = state.pointer;
  p.x += (p.tx - p.x) * 0.06;
  p.y += (p.ty - p.y) * 0.06;
  runDrivers();
  if (canvasLive) advance(time * 1000);
}

export function startScroll({ smooth }: { smooth: boolean }) {
  measure();
  if (smooth) {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
  }
  gsap.ticker.add(frame);
  gsap.ticker.lagSmoothing(0);
  readScroll();

  const onPointer = (e: PointerEvent) => {
    state.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    state.pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    state.pointer.px = e.clientX;
    state.pointer.py = e.clientY;
  };
  let lastW = window.innerWidth;
  const onResize = () => {
    // mobile URL bars change innerHeight while scrolling; only re-layout on real changes
    if (state.isTouch && window.innerWidth === lastW) {
      state.height = window.innerHeight;
      state.aspect = state.width / state.height;
      return;
    }
    lastW = window.innerWidth;
    const t = state.t;
    measure();
    ScrollTrigger.refresh();
    // keep the same moment of the film on screen after a resize / orientation change
    requestAnimationFrame(() => scrollToUnits(t, true));
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", onResize);

  return () => {
    gsap.ticker.remove(frame);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", onResize);
    lenis?.destroy();
    lenis = null;
  };
}

export function lockScroll(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
