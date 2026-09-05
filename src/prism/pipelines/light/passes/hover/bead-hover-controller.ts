import {
  GLASS_ORB_RADIUS,
  GO_CELL_ASPECT,
  GO_GRID_SPACING,
} from "../../../../types";
import type { BeadHoverConfig, BeadHoverUniforms } from "./types";
import { DEFAULT_BEAD_HOVER_CONFIG } from "./types";

interface SingleBeadState {
  hoverProgress: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  targetPointerOffsetX: number;
  targetPointerOffsetY: number;
}

export class BeadHoverController {
  private config: BeadHoverConfig = { ...DEFAULT_BEAD_HOVER_CONFIG };
  private hoveredBeadIndex: number | null = null;
  private activeBeadIndex: number | null = null;
  private lastUpdateTime = performance.now();

  private readonly dx = GO_GRID_SPACING;
  private readonly dy = GO_GRID_SPACING * GO_CELL_ASPECT;
  private readonly radius = GLASS_ORB_RADIUS;
  private readonly hitRadius = GLASS_ORB_RADIUS * 1.15;

  private readonly beadCenters: readonly [number, number][] = [
    [-this.dx, this.dy],   // 0: Top-Left (blsclone - 1/24/26)
    [0, this.dy],          // 1: Top-Center (yukon - 2/22/2026)
    [this.dx, this.dy],    // 2: Top-Right (halfpast*noon - 2/24/26)
    [-this.dx, 0],         // 3: Middle-Left (kodak - 3/28/2026)
    [0, 0],                // 4: Center Tengen (newjeans - 4/27/2026)
    [this.dx, 0],          // 5: Middle-Right (bside - 6/16/2026)
    [-this.dx, -this.dy],  // 6: Bottom-Left (Aedena - 6/27/2026)
    [0, -this.dy],         // 7: Bottom-Center (pawchart - 7/2/2026)
  ];

  private beads: SingleBeadState[] = Array.from({ length: 8 }, () => ({
    hoverProgress: 0,
    pointerOffsetX: 0,
    pointerOffsetY: 0,
    targetPointerOffsetX: 0,
    targetPointerOffsetY: 0,
  }));

  public getConfig(): BeadHoverConfig {
    return this.config;
  }

  public setConfig(patch: Partial<BeadHoverConfig>): void {
    this.config = { ...this.config, ...patch };
  }

  public getHoveredBeadIndex(): number | null {
    return this.hoveredBeadIndex;
  }

  public getActiveBeadIndex(): number | null {
    return this.activeBeadIndex;
  }

  public reset(): void {
    this.hoveredBeadIndex = null;
    this.activeBeadIndex = null;
    this.lastUpdateTime = performance.now();
    for (let i = 0; i < 8; i++) {
      const bead = this.beads[i]!;
      bead.hoverProgress = 0;
      bead.pointerOffsetX = 0;
      bead.pointerOffsetY = 0;
      bead.targetPointerOffsetX = 0;
      bead.targetPointerOffsetY = 0;
    }
  }

  public setActiveBeadIndex(index: number | null): boolean {
    if (this.activeBeadIndex === index) {
      return false;
    }
    this.activeBeadIndex = index;
    return true;
  }

  public toggleActiveBead(index: number): number | null {
    if (this.activeBeadIndex === index) {
      // Retain active state when clicking same bead as requested
      return this.activeBeadIndex;
    }
    this.activeBeadIndex = index;
    return this.activeBeadIndex;
  }

  /**
   * Called on pointer down with world coordinates on the board plane Z = 0.
   * If an orb was clicked, returns the bead index and whether active state changed.
   * If the bead is already active, changed is false and no state change occurs.
   */
  public onPointerDown(worldX: number, worldY: number): { index: number; changed: boolean } | null {
    let closestIndex: number | null = null;
    let closestDist = Infinity;

    for (let i = 0; i < this.beadCenters.length; i++) {
      const [cx, cy] = this.beadCenters[i]!;
      const dist = Math.hypot(worldX - cx, worldY - cy);
      if (dist <= this.hitRadius && dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    if (closestIndex === null) {
      return null;
    }

    if (this.activeBeadIndex === closestIndex) {
      return { index: closestIndex, changed: false };
    }

    this.activeBeadIndex = closestIndex;
    return { index: closestIndex, changed: true };
  }

  /**
   * Called on pointer move with world coordinates on the board plane Z = 0.
   */
  public onPointerMove(worldX: number, worldY: number): number | null {
    let closestIndex: number | null = null;
    let closestDist = Infinity;

    for (let i = 0; i < this.beadCenters.length; i++) {
      const [cx, cy] = this.beadCenters[i]!;
      const dist = Math.hypot(worldX - cx, worldY - cy);
      if (dist <= this.hitRadius && dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    this.hoveredBeadIndex = closestIndex;

    if (closestIndex !== null) {
      const [cx, cy] = this.beadCenters[closestIndex]!;
      const bead = this.beads[closestIndex]!;
      // Normalized pointer offset within bead in [-1.2, 1.2]
      const rawX = (worldX - cx) / this.radius;
      const rawY = (worldY - cy) / this.radius;
      bead.targetPointerOffsetX = Math.max(-1.2, Math.min(1.2, rawX));
      bead.targetPointerOffsetY = Math.max(-1.2, Math.min(1.2, rawY));
    }

    return closestIndex;
  }

  /**
   * Called when pointer leaves canvas.
   */
  public onPointerLeave(): void {
    this.hoveredBeadIndex = null;
  }

  /**
   * Returns true if any bead is currently hovered, active, or in transition/parallax motion.
   */
  public isAnimating(): boolean {
    if (this.hoveredBeadIndex !== null) return true;
    for (let i = 0; i < 8; i++) {
      const b = this.beads[i]!;
      const isTargetActive = this.activeBeadIndex === i;
      const targetHover = isTargetActive ? 1.0 : 0.0;
      if (Math.abs(b.hoverProgress - targetHover) > 0.001) return true;
      if (Math.abs(b.pointerOffsetX - b.targetPointerOffsetX) > 0.001) return true;
      if (Math.abs(b.pointerOffsetY - b.targetPointerOffsetY) > 0.001) return true;
    }
    return false;
  }

  /**
   * Updates spring / lerp transitions for all beads.
   */
  public update(now: number = performance.now()): void {
    const dt = Math.min(0.06, Math.max(0.001, (now - this.lastUpdateTime) / 1000));
    this.lastUpdateTime = now;

    // Transition speed derived from duration
    const speed = 1000 / Math.max(80, this.config.transitionDurationMs);
    const hoverDamp = 1 - Math.exp(-speed * 3.5 * dt);
    const pointerDamp = 1 - Math.exp(-12.0 * dt);

    for (let i = 0; i < 8; i++) {
      const bead = this.beads[i]!;
      const isTargetHovered = this.hoveredBeadIndex === i;
      const isTargetActive = this.activeBeadIndex === i;
      const targetHover = (isTargetHovered || isTargetActive) ? 1.0 : 0.0;

      bead.hoverProgress += (targetHover - bead.hoverProgress) * hoverDamp;

      // Pointer parallax offset interpolation
      if (!isTargetHovered) {
        bead.targetPointerOffsetX *= 0.95;
        bead.targetPointerOffsetY *= 0.95;
      }
      bead.pointerOffsetX += (bead.targetPointerOffsetX - bead.pointerOffsetX) * pointerDamp;
      bead.pointerOffsetY += (bead.targetPointerOffsetY - bead.pointerOffsetY) * pointerDamp;
    }
  }

  /**
   * Generates uniforms for the WebGPU hover shader.
   */
  public getUniforms(): BeadHoverUniforms {
    const smoosh = (p: number) => {
      // Smooth cubic ease with subtle expansion curve
      return Math.sin(p * Math.PI * 0.5);
    };

    return {
      bead0: [
        this.beads[0]!.pointerOffsetX,
        this.beads[0]!.pointerOffsetY,
        this.beads[0]!.hoverProgress,
        smoosh(this.beads[0]!.hoverProgress),
      ],
      bead1: [
        this.beads[1]!.pointerOffsetX,
        this.beads[1]!.pointerOffsetY,
        this.beads[1]!.hoverProgress,
        smoosh(this.beads[1]!.hoverProgress),
      ],
      bead2: [
        this.beads[2]!.pointerOffsetX,
        this.beads[2]!.pointerOffsetY,
        this.beads[2]!.hoverProgress,
        smoosh(this.beads[2]!.hoverProgress),
      ],
      bead3: [
        this.beads[3]!.pointerOffsetX,
        this.beads[3]!.pointerOffsetY,
        this.beads[3]!.hoverProgress,
        smoosh(this.beads[3]!.hoverProgress),
      ],
      bead4: [
        this.beads[4]!.pointerOffsetX,
        this.beads[4]!.pointerOffsetY,
        this.beads[4]!.hoverProgress,
        smoosh(this.beads[4]!.hoverProgress),
      ],
      bead5: [
        this.beads[5]!.pointerOffsetX,
        this.beads[5]!.pointerOffsetY,
        this.beads[5]!.hoverProgress,
        smoosh(this.beads[5]!.hoverProgress),
      ],
      bead6: [
        this.beads[6]!.pointerOffsetX,
        this.beads[6]!.pointerOffsetY,
        this.beads[6]!.hoverProgress,
        smoosh(this.beads[6]!.hoverProgress),
      ],
      bead7: [
        this.beads[7]!.pointerOffsetX,
        this.beads[7]!.pointerOffsetY,
        this.beads[7]!.hoverProgress,
        smoosh(this.beads[7]!.hoverProgress),
      ],
      config: [
        this.config.fisheyeStrength,
        this.config.parallaxStrength,
        this.config.smooshPower,
        0.0,
      ],
      metrics: [
        this.dx,
        this.dy,
        this.radius,
        0.0,
      ],
    };
  }
}

export const globalBeadHoverController = new BeadHoverController();
