import type { PrismRenderer } from '../../prism/renderer';
import {
  DEFAULT_PRISM_CONTROLS,
  DEFAULT_GRADIENT_CONTROLS,
  DEFAULT_WIND_CONTROLS,
  type PrismControls,
} from '../../prism/types';

export type IntroPhase = 'blank-beads' | 'baduk-lines' | 'lighting' | 'komorebi' | 'settled';

export interface HeroIntroCallbacks {
  onPhaseChange?: (phase: IntroPhase) => void;
  onComplete?: () => void;
}

export class HeroIntroController {
  private renderer: PrismRenderer | null = null;
  private animFrameId: number | null = null;
  private startTime = 0;
  private isRunning = false;
  private isSkipping = false;
  private currentPhase: IntroPhase = 'blank-beads';
  private callbacks: HeroIntroCallbacks;

  // Total duration of the choreographed reveal
  private readonly TOTAL_DURATION = 5.0; // seconds

  // Baseline values from types
  private baseGradient = DEFAULT_GRADIENT_CONTROLS;
  private baseWind = DEFAULT_WIND_CONTROLS;
  private baseLightMode = DEFAULT_PRISM_CONTROLS.lightMode;

  constructor(callbacks?: HeroIntroCallbacks) {
    this.callbacks = callbacks ?? {};
  }

  public setRenderer(renderer: PrismRenderer | null) {
    this.renderer = renderer;
    if (renderer) {
      this.play();
    } else {
      this.dispose();
    }
  }

  public play() {
    if (!this.renderer) return;
    this.isRunning = true;
    this.isSkipping = false;
    this.startTime = performance.now();
    this.updatePhase('blank-beads');

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.applyFrame(0);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  public skip() {
    if (!this.isRunning) return;
    this.isSkipping = true;
    this.applySettledControls();
    this.finish();
  }

  public replay() {
    this.play();
  }

  private loop = () => {
    if (!this.isRunning || !this.renderer) return;

    const now = performance.now();
    const elapsedSeconds = (now - this.startTime) / 1000;
    const t = this.isSkipping ? this.TOTAL_DURATION : elapsedSeconds;

    this.applyFrame(t);

    if (t >= this.TOTAL_DURATION) {
      this.finish();
      return;
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private applyFrame(t: number) {
    if (!this.renderer) return;

    // Determine current visual phase for UI indicators
    if (t < 1.0) {
      this.updatePhase('blank-beads');
    } else if (t < 2.3) {
      this.updatePhase('baduk-lines');
    } else if (t < 3.4) {
      this.updatePhase('lighting');
    } else if (t < 4.8) {
      this.updatePhase('komorebi');
    } else {
      this.updatePhase('settled');
    }

    // 1. Baduk Board Lines (reveals smoothly: 1.0s -> 2.7s with staggered drafting)
    const pGrid = easeInOutCubic(clamp01((t - 1.0) / 1.7));
    // currentGridDraw drives the staggered row-by-row WGSL shader stroke
    const currentGridDraw = clamp01((t - 1.0) / 1.6);
    const currentGridOpacity = this.baseGradient.gridOpacity * clamp01(pGrid * 1.25);
    const currentGridLineWidth = 0.0010 + (this.baseGradient.gridLineWidth - 0.0010) * pGrid;

    // 2. Studio Lighting & Caustics (reveals: 2.1s -> 3.7s)
    const pLight = easeInOutCubic(clamp01((t - 2.1) / 1.6));
    const currentExposure = this.baseGradient.directExposure;
    const currentAmbient = 0.12 + (this.baseLightMode.wall.ambientFill - 0.12) * pLight;
    const currentCausticStrength = 0.2 + (this.baseLightMode.caustic.strength - 0.2) * pLight;

    // Polished granite veining and normal roughness only emerge during Phase 3 with the studio lighting.
    // At t < 2.1s (Phase 1 & 2), roughness and normal strength are strictly 0.0 (completely plain screen, no textures/noise).
    const currentGraniteRoughness = this.baseGradient.graniteRoughness * pLight;
    const currentGraniteNormal = this.baseGradient.graniteNormalStrength * pLight;
    const currentWallNormal = this.baseLightMode.wall.normalStrength * pLight;

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const blankColor = isDark ? '#000000' : '#ffffff';

    // Wall colors transition from pure blank background into the studio granite palette
    const currentHighlight = lerpColor(blankColor, this.baseGradient.colorHighlight, pLight);
    const currentMid = isDark ? lerpColor(blankColor, this.baseGradient.colorMid, pLight) : '#ffffff';
    const currentShadow = lerpColor(blankColor, this.baseGradient.colorShadow, pLight);

    // 3. Komorebi Leaf Shadows (reveals: 3.3s -> 4.9s)
    // CRITICAL: lightmapMix is tied to Phase 4 (pWind) rather than Phase 3 (pLight)
    // so that no shadows attached to the komorebi leaf shadows appear when caustics are introduced!
    const pWind = easeInOutCubic(clamp01((t - 3.3) / 1.6));
    const currentLeafShadow = this.baseWind.leafShadowStrength * pWind;
    const currentLightmapMix = this.baseGradient.lightmapMix * pWind;
    const currentLeafShimmer = Math.sin(pWind * Math.PI) * 0.2;

    // Assemble and dispatch WebGPU controls frame
    const nextControls: PrismControls = {
      ...DEFAULT_PRISM_CONTROLS,
      gradient: {
        ...this.baseGradient,
        gridOpacity: currentGridOpacity,
        gridLineWidth: currentGridLineWidth,
        gridDrawProgress: currentGridDraw,
        directExposure: currentExposure,
        graniteRoughness: currentGraniteRoughness,
        graniteNormalStrength: currentGraniteNormal,
        lightmapMix: currentLightmapMix,
        colorHighlight: currentHighlight,
        colorMid: currentMid,
        colorShadow: currentShadow,
      },
      lightMode: {
        ...this.baseLightMode,
        wall: {
          ...this.baseLightMode.wall,
          normalStrength: currentWallNormal,
          ambientFill: currentAmbient,
        },
        caustic: {
          ...this.baseLightMode.caustic,
          strength: currentCausticStrength,
        },
      },
      wind: {
        ...this.baseWind,
        leafShadowStrength: currentLeafShadow,
        leafShimmer: currentLeafShimmer,
      },
    };

    this.renderer.setControls?.(nextControls);
  }

  private applySettledControls() {
    if (!this.renderer) return;
    this.renderer.setControls?.(DEFAULT_PRISM_CONTROLS);
  }

  private updatePhase(phase: IntroPhase) {
    if (this.currentPhase !== phase) {
      this.currentPhase = phase;
      this.callbacks.onPhaseChange?.(phase);
    }
  }

  private finish() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.updatePhase('settled');
    this.applySettledControls();
    this.callbacks.onComplete?.();
  }

  public dispose() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.renderer = null;
  }
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const norm1 = c1.startsWith('#') ? c1.slice(1) : c1;
  const norm2 = c2.startsWith('#') ? c2.slice(1) : c2;
  const r1 = parseInt(norm1.slice(0, 2), 16);
  const g1 = parseInt(norm1.slice(2, 4), 16);
  const b1 = parseInt(norm1.slice(4, 6), 16);
  const r2 = parseInt(norm2.slice(0, 2), 16);
  const g2 = parseInt(norm2.slice(2, 4), 16);
  const b2 = parseInt(norm2.slice(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
