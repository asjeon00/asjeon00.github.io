import { CAMERA_ORBIT_LERP } from "../types";

type Pair = readonly [number, number];

export interface PrismInteraction {
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerLeave: () => void;
  /** Feeds the same normalized path as a real pointer without DOM events. */
  readonly setNormalizedPointer: (position: Pair) => void;
  /** Returns current normalized pointer coordinates and smoothed velocity. */
  getPointerState(): { readonly uv: Pair; readonly velocity: Pair };
  /** Returns the eased value only when the lamp moved this frame. */
  stepAim(): Pair | undefined;
  /** Returns the eased value only when the camera orbit moved this frame. */
  stepOrbit(): Pair | undefined;
  setOrbitEnabled(enabled: boolean): void;
  isOrbitEnabled(): boolean;
}

/** Pointer normalization and easing, independent from GPU/render ownership. */
export function createPrismInteraction(
  canvas: HTMLCanvasElement,
  invalidate: () => void
): PrismInteraction {
  let orbitEnabled = false;
  let targetOrbit: [number, number] = [0, 0];
  let currentOrbit: [number, number] = [0, 0];
  let lastOrbit: [number, number] = [0, 0];
  let uv: [number, number] = [0.5, 0.5];
  const velocity: [number, number] = [0, 0];

  return {
    setOrbitEnabled(enabled: boolean) {
      orbitEnabled = enabled;
      if (!enabled) {
        targetOrbit = [0, 0];
      }
      invalidate();
    },
    isOrbitEnabled() {
      return orbitEnabled;
    },
    onPointerMove(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      uv = [x, y];
      if (orbitEnabled) {
        targetOrbit = [
          Math.min(1, Math.max(-1, (x - 0.5) * 2)),
          Math.min(1, Math.max(-1, (y - 0.5) * 2)),
        ];
        invalidate();
      }
    },
    onPointerLeave() {
      if (orbitEnabled) {
        targetOrbit = [0, 0];
        invalidate();
      }
    },
    setNormalizedPointer(position: Pair) {
      uv = [position[0], position[1]];
      if (orbitEnabled) {
        targetOrbit = [
          Math.min(1, Math.max(-1, (position[0] - 0.5) * 2)),
          Math.min(1, Math.max(-1, (position[1] - 0.5) * 2)),
        ];
        invalidate();
      }
    },
    getPointerState() {
      return { uv, velocity };
    },
    stepAim() {
      return undefined;
    },
    stepOrbit() {
      if (!orbitEnabled && Math.abs(currentOrbit[0]) < 1e-4 && Math.abs(currentOrbit[1]) < 1e-4) {
        return undefined;
      }
      currentOrbit[0] += (targetOrbit[0] - currentOrbit[0]) * CAMERA_ORBIT_LERP;
      currentOrbit[1] += (targetOrbit[1] - currentOrbit[1]) * CAMERA_ORBIT_LERP;

      const d0 = Math.abs(currentOrbit[0] - lastOrbit[0]);
      const d1 = Math.abs(currentOrbit[1] - lastOrbit[1]);
      if (d0 > 1e-4 || d1 > 1e-4) {
        lastOrbit = [currentOrbit[0], currentOrbit[1]];
        return currentOrbit;
      }
      return undefined;
    },
  };
}

/** A slow centered circle used as the virtual pointer on mobile layouts. */
export function automaticPointerPosition(_timeSeconds?: number): Pair {
  return [0.5, 0.5];
}
