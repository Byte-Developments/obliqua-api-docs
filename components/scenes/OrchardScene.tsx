import { SceneCopy, Fade } from "../typography/SceneCopy";
import { EditorialHeadline } from "../typography/EditorialHeadline";
import { SmallLabel } from "../typography/SmallLabel";

// SCENES 03 – 05 — the macro branch, the orchard, the reach. Photography is in WebGL.
export function OrchardScene() {
  return (
    <>
      <SceneCopy at={[226, 244, 284, 300]} className="absolute inset-0 text-ink">
        <div className="frame relative h-full">
          <div className="absolute left-0 md:left-[8.333%] bottom-[12vh]">
            <SmallLabel className="mb-4 opacity-70">03 — Cultivation</SmallLabel>
            <EditorialHeadline size="md" lines={["The first cut", <em key="e" className="italic">is a promise.</em>]} />
          </div>
        </div>
      </SceneCopy>

      <SceneCopy at={[316, 334, 372, 392]} className="absolute inset-0 text-paper shadow-soft">
        <div className="frame relative h-full">
          <div className="absolute left-0 md:left-[8.333%] top-[22vh]">
            <EditorialHeadline size="lg" lines={["Grown slowly,", <em key="e" className="italic">on purpose.</em>]} />
            <Fade className="mt-6 max-w-[30ch] text-[13px] leading-[1.5] text-paper/85">
              Three hundred and twelve trees. One intention. We wait for the fruit, never the other way around.
            </Fade>
          </div>
          <SmallLabel className="absolute right-0 bottom-7 md:bottom-9 text-paper/80">04 — The Orchard</SmallLabel>
        </div>
      </SceneCopy>

      <SceneCopy at={[410, 424, 452, 466]} className="absolute inset-0 text-paper shadow-soft">
        <div className="frame relative h-full">
          <div className="absolute right-0 md:right-[8.333%] bottom-[14vh] text-right">
            <SmallLabel className="mb-4 opacity-80">05 — The Reach</SmallLabel>
            <EditorialHeadline size="md" lines={["Choose one.", <em key="e" className="italic">Only one.</em>]} />
          </div>
        </div>
      </SceneCopy>
    </>
  );
}
