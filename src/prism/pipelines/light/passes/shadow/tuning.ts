import { DROPLET_RADIUS, type Vec2 } from "../../../../types";
import { createShadowGeometry } from "./mesh";
import type { Gpu, Geometry } from "vgpu";

const SHADOW_SEGMENTS = 24;
const DROPLET_SHADOW_POLY: readonly Vec2[] = Object.freeze(
  Array.from({ length: SHADOW_SEGMENTS }, (_, i) => {
    const theta = (i / SHADOW_SEGMENTS) * Math.PI * 2;
    return [
      DROPLET_RADIUS * Math.cos(theta),
      DROPLET_RADIUS * Math.sin(theta),
    ] as const;
  })
);

export const LIGHT_SHADOW_TUNING = Object.freeze({
  projection: [DROPLET_RADIUS * 0.35, -DROPLET_RADIUS * 0.45] as const,
  nearPenumbra: DROPLET_RADIUS * 0.02,
  farPenumbra: DROPLET_RADIUS * 0.15,
  midRing: 0.5,
  midCoverage: 0.38,
  opacity: 0.55,
  farStrength: 0.88,
  color: [0.03, 0.035, 0.045] as const,
});

export function createPrismShadowGeometry(gpu: Gpu, label: string): Geometry {
  return createShadowGeometry(gpu, label, DROPLET_SHADOW_POLY, LIGHT_SHADOW_TUNING);
}

export function prismShadowUniforms(
  viewProjection: ArrayLike<number>
): Record<string, unknown> {
  return {
    viewProjection,
    color: LIGHT_SHADOW_TUNING.color,
    opacity: LIGHT_SHADOW_TUNING.opacity,
    farStrength: LIGHT_SHADOW_TUNING.farStrength,
  };
}
