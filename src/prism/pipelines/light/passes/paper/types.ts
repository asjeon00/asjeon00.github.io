export interface PaperControls {
  readonly enabled: boolean;
  readonly progress: number; // 0.0 (offscreen left) to 1.0 (settled under beads)
  readonly width: number;
  readonly height: number;
  readonly restX: number;
  readonly restY: number;
  readonly startX: number;
  readonly startY: number;
  readonly elevation: number;
  readonly waveCurl: number;
  readonly grain: number;
  readonly fiberScale: number;
  readonly roughness: number;
  readonly translucency: number;
  readonly warmth: number;
  readonly inkBleed: number;
  readonly shadowOpacity: number;
  readonly baseColor: string;
}

export const DEFAULT_PAPER_CONTROLS: PaperControls = {
  enabled: true,
  progress: 0.0,
  width: 2.35,
  height: 1.75,
  restX: 0.0,
  restY: 0.15,
  startX: -4.2,
  startY: 0.15,
  elevation: 0.014,
  waveCurl: 0.085,
  // Authentic parameters ported from 031-cloth-simulation Fine Art Cotton / Japanese Washi
  grain: 0.75,
  fiberScale: 220.0,
  roughness: 0.36,
  translucency: 0.45,
  warmth: 0.55,
  inkBleed: 0.6,
  shadowOpacity: 0.42,
  baseColor: "#faf7f0",
};

export interface PaperUniformsData {
  readonly viewProjection: Float32Array;
  readonly paperTransform: readonly [number, number, number, number]; // posX, posY, width, height
  readonly paperState: readonly [number, number, number, number]; // progress, waveCurl, elevation, opacity
  readonly paperMaterial: readonly [number, number, number, number]; // grain, fiberScale, roughness, translucency
  readonly paperColor: readonly [number, number, number, number]; // r, g, b, warmth
  readonly lightDir: readonly [number, number, number, number]; // lx, ly, lz, exposure
  readonly shadowParams: readonly [number, number, number, number]; // shadowOpacity, spread, offsetX, offsetY
}
