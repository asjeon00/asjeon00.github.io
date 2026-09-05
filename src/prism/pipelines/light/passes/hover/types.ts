export interface BeadHoverConfig {
  /** Barrel/fisheye curvature factor: higher values expand center and compress perimeter (0.5 - 2.5) */
  fisheyeStrength: number;
  /** Perspective depth parallax sensitivity to pointer offset within the bead (0.0 - 0.4) */
  parallaxStrength: number;
  /** Organic circular aperture expansion intensity on transition (0.5 - 1.5) */
  smooshPower: number;
  /** Spring / ease duration in milliseconds (150 - 800) */
  transitionDurationMs: number;
}

export const DEFAULT_BEAD_HOVER_CONFIG: BeadHoverConfig = {
  fisheyeStrength: 1.35,
  parallaxStrength: 0.18,
  smooshPower: 1.0,
  transitionDurationMs: 380,
};

export interface BeadHoverUniforms {
  /** bead0: [pointerOffsetX, pointerOffsetY, hoverProgress, smooshScale] */
  bead0: readonly [number, number, number, number];
  bead1: readonly [number, number, number, number];
  bead2: readonly [number, number, number, number];
  bead3: readonly [number, number, number, number];
  bead4: readonly [number, number, number, number];
  bead5: readonly [number, number, number, number];
  bead6: readonly [number, number, number, number];
  bead7: readonly [number, number, number, number];
  /** config: [fisheyeStrength, parallaxStrength, smooshPower, unused] */
  config: readonly [number, number, number, number];
  /** metrics: [gridSpacingDx, gridSpacingDy, beadRadius, unused] */
  metrics: readonly [number, number, number, number];
}
