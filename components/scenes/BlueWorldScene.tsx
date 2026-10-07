import { SceneCopy, Fade } from "../typography/SceneCopy";
import { EditorialHeadline } from "../typography/EditorialHeadline";
import { SmallLabel } from "../typography/SmallLabel";
import { GridGuides } from "../effects/GridGuides";

// SCENE 10 — minimal, almost empty: a flat cobalt field, hairlines, an index and a few words.
export function BlueWorldScene() {
  return (
    <>
      <GridGuides
        at={[770, 800, 960, 1000]}
        tone="light"
        cols={[1, 4, 7, 8, 11]}
        crosses={[[4, 18], [7, 82], [11, 82], [1, 82]]}
        labels={[{ x: 4, y: 18, text: "D1" }, { x: 7, y: 82, text: "G6" }, { x: 11, y: 82, text: "K6 — 1:240" }]}
      />
      <SceneCopy at={[786, 810, 858, 880]} className="absolute inset-0 text-paper">
        <div className="frame relative h-full">
          {/* the index rule */}
          <div className="absolute left-0 md:left-[8.333%] top-[18vh] bottom-[18vh] hidden md:flex flex-col justify-between">
            {["01", "02", "03"].map((n, i) => (
              <Fade key={n} className="flex items-center gap-3">
                <span className="block h-px w-3 bg-paper/60" />
                <span className="label text-paper/70">{n}</span>
                <span className="label text-paper/40">{["Grow", "Study", "Stage"][i]}</span>
              </Fade>
            ))}
            <span className="absolute left-0 top-0 bottom-0 w-px bg-paper/25" />
          </div>

          <div className="absolute left-0 md:left-[33.33%] top-[44vh] md:top-[40vh]">
            <EditorialHeadline size="md" lines={["The ordinary fruit,", <em key="e" className="italic">reconsidered.</em>]} />
          </div>

          <div className="absolute right-0 md:right-[8.333%] top-[16vh] md:top-[18vh] w-[min(100%,340px)]">
            <SmallLabel className="mb-5 text-paper/70">09 — Under one roof</SmallLabel>
            <EditorialHeadline size="sm" lines={["Everything it takes to be", <em key="e" className="italic">seen, under one roof.</em>]} />
            <Fade className="mt-5 text-[12px] leading-[1.55] text-paper/80 max-w-[34ch]">
              Cultivation, curation, ceremony. We treat the ordinary fruit as a material for attention — grown, studied, sliced
              and staged until it can no longer be ignored.
            </Fade>
          </div>
        </div>
      </SceneCopy>
    </>
  );
}
