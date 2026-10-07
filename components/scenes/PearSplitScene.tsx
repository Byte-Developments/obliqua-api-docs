import { SceneCopy } from "../typography/SceneCopy";
import { SmallLabel } from "../typography/SmallLabel";

// SCENES 08 – 09 — two halves; the cobalt portal between them is rendered in WebGL.
export function PearSplitScene() {
  return (
    <SceneCopy at={[672, 684, 700, 714]} className="absolute inset-0 text-ink">
      <div className="frame relative h-full">
        <SmallLabel className="absolute left-1/2 -translate-x-1/2 top-[14vh] text-center opacity-70 whitespace-nowrap">
          08 — Two halves, one argument
        </SmallLabel>
      </div>
    </SceneCopy>
  );
}
