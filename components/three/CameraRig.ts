import * as THREE from "three";
import { state } from "@/lib/store";

// Every world computes where the lens should be from the timeline; this applies it with a
// very small, damped pointer drift so stills breathe without ever feeling like orbit controls.

const target = new THREE.Vector3();
const offset = new THREE.Vector3();

export function applyCamera(
  camera: THREE.PerspectiveCamera,
  pos: readonly number[],
  look: readonly number[],
  opts: { roll?: number; fov?: number; sway?: number } = {}
) {
  const sway = (opts.sway ?? 0.12) * (state.isTouch ? 0 : 1);
  offset.set(state.pointer.x * sway, state.pointer.y * sway * 0.6, 0);
  camera.position.set(pos[0] + offset.x, pos[1] + offset.y, pos[2]);
  target.set(look[0], look[1], look[2]);
  camera.up.set(Math.sin(opts.roll ?? 0), Math.cos(opts.roll ?? 0), 0);
  camera.lookAt(target);
  const fov = opts.fov ?? 35;
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}

/** Half extents of the view frustum at `distance` from a camera. */
export function frustumHalf(camera: THREE.PerspectiveCamera, distance: number) {
  const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
  return { h, w: h * camera.aspect };
}
