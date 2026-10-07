import { SceneCopy, Fade } from "../typography/SceneCopy";
import { EditorialHeadline } from "../typography/EditorialHeadline";
import { SmallLabel } from "../typography/SmallLabel";

// SCENES 11 – 13 — the printed pear, the golden pear, the person for scale.
export function MonumentPearScene() {
  return (
    <>
      <SceneCopy at={[904, 924, 984, 1000]} className="absolute inset-0 text-paper">
        <div className="frame relative h-full">
          <div className="absolute left-0 md:left-[8.333%] bottom-7 md:bottom-9">
            <SmallLabel className="text-paper/80">
              10 — Specimen, printed
              <br />
              <span className="opacity-60">offset, one colour, 1:1</span>
            </SmallLabel>
          </div>
          {/* dimension rule */}
          <div className="absolute right-0 top-[16vh] bottom-[16vh] hidden md:flex flex-col items-end justify-between text-paper/70">
            <SmallLabel>13.0 m</SmallLabel>
            <span className="absolute right-0 top-4 bottom-4 w-px bg-paper/35" />
            <SmallLabel>6.5</SmallLabel>
            <SmallLabel>0</SmallLabel>
          </div>
        </div>
      </SceneCopy>

      <SceneCopy at={[1004, 1022, 1064, 1082]} className="absolute inset-0 text-paper shadow-soft">
        <div className="frame relative h-full">
          <div className="absolute right-0 md:right-[8.333%] top-[14vh] md:top-[16vh] w-[min(100%,330px)] text-left">
            <SmallLabel className="mb-5 text-paper/70">11 — Material</SmallLabel>
            <EditorialHeadline size="sm" lines={["We shape what others", <em key="e" className="italic">simply consume.</em>]} />
            <Fade className="mt-5 text-[12px] leading-[1.55] text-paper/85 max-w-[32ch]">
              From orchard to object, every part of the pear is considered as material, symbol and experience.
            </Fade>
          </div>
        </div>
      </SceneCopy>

      <SceneCopy at={[1088, 1100, 1124, 1136]} className="absolute inset-0 text-paper">
        <div className="frame relative h-full">
          <SmallLabel className="absolute left-0 md:left-[8.333%] bottom-7 md:bottom-9 text-paper/80">
            12 — For scale: one admirer, 1.85 m
          </SmallLabel>
        </div>
      </SceneCopy>
    </>
  );
}
