import { SceneCopy, Fade } from "../typography/SceneCopy";
import { EditorialHeadline } from "../typography/EditorialHeadline";
import { SmallLabel } from "../typography/SmallLabel";
import { GridGuides } from "../effects/GridGuides";

// SCENES 06 – 07 — the portrait leaves the left of the frame empty on purpose; the copy sits
// small inside that ivory silence.
export function PortraitScene() {
  return (
    <>
      <GridGuides at={[494, 510, 560, 580]} tone="dark" cols={[1, 5]} crosses={[[1, 18], [5, 82]]} labels={[{ x: 1, y: 18, text: "Portrait, 06" }]} />
      <SceneCopy at={[494, 512, 556, 576]} className="absolute inset-0 text-ink">
        <div className="md:hidden absolute inset-x-0 bottom-0 h-[52vh] bg-gradient-to-t from-[#efe9dc] via-[#efe9dc]/80 to-transparent" />
        <div className="frame relative h-full">
          <div className="absolute left-0 md:left-[8.333%] bottom-[9vh] md:bottom-auto md:top-[30vh]">
            <SmallLabel className="mb-6 opacity-60">06 — Portrait with fruit</SmallLabel>
            <EditorialHeadline size="lg" lines={["We give it", <em key="e" className="italic">what it earns.</em>]} />
            <Fade className="mt-8 max-w-[34ch] text-[12px] md:text-[13px] leading-[1.55] text-ink/75">
              Every pear is chosen by hand, turned toward the light and held a moment longer than necessary. Patience is the
              only ingredient we refuse to measure.
            </Fade>
          </div>
        </div>
      </SceneCopy>

      <SceneCopy at={[606, 620, 640, 654]} className="absolute inset-0 text-ink">
        <div className="md:hidden absolute inset-x-0 bottom-0 h-[34vh] bg-gradient-to-t from-[#efe9dc] via-[#efe9dc]/80 to-transparent" />
        <div className="frame relative h-full">
          <div className="absolute left-0 md:left-[8.333%] bottom-[12vh]">
            <SmallLabel className="mb-4 opacity-60">07 — Inspection</SmallLabel>
            <EditorialHeadline size="md" lines={["A cut,", <em key="e" className="italic">not a consumption.</em>]} />
          </div>
        </div>
      </SceneCopy>
    </>
  );
}
