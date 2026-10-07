// Very subtle film grain over everything (an SVG turbulence tile, shifted every few frames).
export function Grain() {
  return <div className="grain pointer-events-none fixed -inset-[50%] z-[60]" aria-hidden="true" />;
}
