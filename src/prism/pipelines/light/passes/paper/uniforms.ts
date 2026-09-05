import type { PrismRuntime } from "../../../../runtime/types";
import type { PaperControls } from "./types";
import { DEFAULT_PAPER_CONTROLS } from "./types";

function parseHexColor(
  hex: string | undefined,
  fallback: readonly [number, number, number] = [0.98, 0.968, 0.941]
): readonly [number, number, number] {
  if (!hex) return fallback;
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return [
      Number.parseInt(clean[0]! + clean[0]!, 16) / 255,
      Number.parseInt(clean[1]! + clean[1]!, 16) / 255,
      Number.parseInt(clean[2]! + clean[2]!, 16) / 255,
    ];
  }
  if (clean.length === 6) {
    return [
      Number.parseInt(clean.slice(0, 2), 16) / 255,
      Number.parseInt(clean.slice(2, 4), 16) / 255,
      Number.parseInt(clean.slice(4, 6), 16) / 255,
    ];
  }
  return fallback;
}

export function paperUniforms(
  runtime: PrismRuntime,
  controls?: Partial<PaperControls>,
  animProgress?: number
): Record<string, unknown> {
  const cfg = { ...DEFAULT_PAPER_CONTROLS, ...controls };
  const p = animProgress !== undefined ? animProgress : cfg.progress;

  // Smooth slide trajectory from startX to restX
  const curX = cfg.startX + (cfg.restX - cfg.startX) * p;
  const curY = cfg.startY + (cfg.restY - cfg.startY) * p;
  const colorRgb = parseHexColor(cfg.baseColor);

  return {
    viewProjection: runtime.view.viewProjection,
    paperTransform: [curX, curY, cfg.width, cfg.height],
    paperState: [
      p,
      cfg.waveCurl,
      cfg.elevation,
      cfg.enabled ? Math.min(p * 2.5, 1.0) : 0.0,
    ],
    paperMaterial: [
      cfg.grain,
      cfg.fiberScale,
      cfg.roughness,
      cfg.translucency,
    ],
    paperColor: [colorRgb[0], colorRgb[1], colorRgb[2], cfg.warmth],
    lightDir: [-0.48, 0.56, 0.68, 1.05],
    shadowParams: [cfg.shadowOpacity, 0.08, 0.025, -0.035],
  };
}
