import { SceneCopy, Fade } from "../typography/SceneCopy";
import { EditorialHeadline } from "../typography/EditorialHeadline";
import { SmallLabel } from "../typography/SmallLabel";
import { GridGuides } from "../effects/GridGuides";

// SCENE 01 — copy over the cobalt hero. The figure and curtain live in WebGL behind it.
export function HeroScene() {
  return (
    <>
      <GridGuides
        at={[-10, -1, 30, 70]}
        tone="light"
        cols={[1, 6, 11]}
        crosses={[[1, 18], [6, 82], [11, 18]]}
        labels={[{ x: 1, y: 18, text: "A1" }, { x: 6, y: 82, text: "F6 · 1:1" }, { x: 11, y: 18, text: "K1" }]}
      />
      <SceneCopy at={[-10, -1, 18, 62]} className="absolute inset-0 text-paper" as="header">
        <div className="frame relative h-full">
          <div className="absolute left-0 md:left-[8.333%] top-[13vh] md:top-[29vh]">
            <SmallLabel className="mb-6 md:mb-8 opacity-80">Nº 01 — Appearance</SmallLabel>
            <EditorialHeadline as="h1" size="xl" lines={["Pear makes", <>you <em className="italic">appear.</em></>]} />
            <Fade className="mt-7 md:mt-10 max-w-[24ch] text-[13px] md:text-[15px] leading-[1.45] text-paper/85">
              Not a fruit on the shelf.
              <br />A presence in the optic.
            </Fade>
          </div>

          <div className="absolute left-0 md:left-[8.333%] bottom-7 md:bottom-9 flex gap-10 text-paper/75">
            <SmallLabel>
              Pyrus communis
              <br />
              <span className="opacity-60">considered, 2026</span>
            </SmallLabel>
            <SmallLabel className="hidden md:block">
              45°26′N 12°19′E
              <br />
              <span className="opacity-60">orchard of record</span>
            </SmallLabel>
          </div>

          <SmallLabel className="absolute right-0 bottom-7 md:bottom-9 hidden md:flex items-center gap-3 text-paper/75">
            <span className="scroll-cue block h-8 w-px bg-current/60 origin-top" />
            Scroll to enter
          </SmallLabel>
        </div>
      </SceneCopy>
    </>
  );
}
