import { Experience } from "@/components/Experience";

export default function Page() {
  return (
    <>
      {/* The full story as plain text for assistive technology and search; the film is visual. */}
      <article className="sr-only">
        <h1>Pear makes you appear.</h1>
        <p>Not a fruit on the shelf. A presence in the optic.</p>
        <p>A figure in ivory linen steps out from behind a heavy curtain. We pass through the cloth into an orchard: hands prune a young branch, the canopy fills with pears, a hand reaches for one ripe fruit.</p>
        <h2>We give it what it earns.</h2>
        <p>Every pear is chosen by hand, turned toward the light and held a moment longer than necessary. Patience is the only ingredient we refuse to measure.</p>
        <p>The pear is sliced; two halves part and open onto a field of cobalt blue.</p>
        <h2>Everything it takes to be seen, under one roof.</h2>
        <p>Cultivation, curation, ceremony. We treat the ordinary fruit as a material for attention.</p>
        <h2>We shape what others simply consume.</h2>
        <p>From orchard to object, every part of the pear is considered as material, symbol and experience. A pear thirteen metres tall is restored inside timber scaffolding by Renaissance artisans and documented in architectural drawings.</p>
        <h2>Perfectly ordinary. Entirely considered.</h2>
      </article>
      <Experience />
    </>
  );
}
