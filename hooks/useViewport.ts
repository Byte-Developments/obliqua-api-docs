"use client";

import { useEffect, useState } from "react";

/** Coarse viewport class for layout decisions that do need a render (rare). */
export function useViewport() {
  const [vp, setVp] = useState({ width: 1440, height: 900, mobile: false });
  useEffect(() => {
    const update = () => setVp({ width: window.innerWidth, height: window.innerHeight, mobile: window.innerWidth < 768 });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vp;
}
