import { SceneCopy } from "../typography/SceneCopy";
import { SmallLabel } from "../typography/SmallLabel";

// SCENE 02 — the camera is inside the cloth; the only thing on screen is a whisper of a caption.
export function FabricTransition() {
  return (
    <SceneCopy at={[150, 165, 192, 206]} className="absolute inset-0 text-ink/70">
      <div className="frame relative h-full">
        <SmallLabel className="absolute left-0 md:left-[8.333%] bottom-7 md:bottom-9">02 — Passage, through linen</SmallLabel>
      </div>
    </SceneCopy>
  );
}
