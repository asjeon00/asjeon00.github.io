import {
  GLASS_ORB_RADIUS,
  GO_CELL_ASPECT,
  GO_GRID_SPACING,
} from "../../../../types";
import type { PaperControls } from "./types";
import { DEFAULT_PAPER_CONTROLS } from "./types";

export type PaperAnimState = "hidden" | "sliding-in" | "settled" | "sliding-out";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class PaperController {
  private state: PaperAnimState = "hidden";
  private progress = 0.0;
  private animStartTime = 0;
  private animStartProgress = 0.0;
  private animTargetProgress = 0.0;
  private animDuration = 1200; // ms
  private controls: PaperControls = { ...DEFAULT_PAPER_CONTROLS };

  // 5 Gomoku bead positions on the Baduk board
  private readonly dx = GO_GRID_SPACING;
  private readonly dy = GO_GRID_SPACING * GO_CELL_ASPECT;
  private readonly beadCenters: readonly [number, number][] = [
    [0, 0],              // Central Tengen
    [this.dx, 0],        // Right
    [-this.dx, 0],       // Left
    [0, this.dy],        // Top
    [this.dx, this.dy],  // Top-Right
  ];
  private readonly hitRadius = GLASS_ORB_RADIUS * 1.35;

  public getControls(): PaperControls {
    return this.controls;
  }

  public setControls(patch: Partial<PaperControls>) {
    this.controls = { ...this.controls, ...patch };
  }

  public getState(): PaperAnimState {
    return this.state;
  }

  public getProgress(): number {
    return this.progress;
  }

  public isVisible(): boolean {
    return this.progress > 0.001;
  }

  /**
   * Tests whether world position (x, y) on the board plane intersects any of the 5 glass beads.
   */
  public isBeadHit(worldX: number, worldY: number): boolean {
    for (const [cx, cy] of this.beadCenters) {
      const dist = Math.hypot(worldX - cx, worldY - cy);
      if (dist <= this.hitRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Tests whether world position (x, y) on the board plane intersects the paper sheet.
   */
  public isPaperHit(worldX: number, worldY: number): boolean {
    if (this.progress < 0.2) return false;
    const curX =
      this.controls.startX +
      (this.controls.restX - this.controls.startX) * this.progress;
    const curY =
      this.controls.startY +
      (this.controls.restY - this.controls.startY) * this.progress;
    const halfW = this.controls.width * 0.5;
    const halfH = this.controls.height * 0.5;
    return Math.abs(worldX - curX) <= halfW && Math.abs(worldY - curY) <= halfH;
  }

  public isInteractiveHit(worldX: number, worldY: number): boolean {
    return (
      this.isBeadHit(worldX, worldY) ||
      (this.state === "settled" && this.isPaperHit(worldX, worldY))
    );
  }

  public toggle(now: number = performance.now()): boolean {
    if (this.state === "settled" || (this.state === "sliding-in" && this.progress > 0.5)) {
      this.slideOut(now);
      return false;
    } else {
      this.slideIn(now);
      return true;
    }
  }

  public slideIn(now: number = performance.now()) {
    this.state = "sliding-in";
    this.animStartTime = now;
    this.animStartProgress = this.progress;
    this.animTargetProgress = 1.0;
    this.animDuration = 1200;
  }

  public slideOut(now: number = performance.now()) {
    this.state = "sliding-out";
    this.animStartTime = now;
    this.animStartProgress = this.progress;
    this.animTargetProgress = 0.0;
    this.animDuration = 900;
  }

  public update(now: number = performance.now()): number {
    if (this.state === "hidden") {
      this.progress = 0.0;
      return 0.0;
    }
    if (this.state === "settled") {
      this.progress = 1.0;
      return 1.0;
    }

    const elapsed = now - this.animStartTime;
    const t = Math.min(Math.max(elapsed / this.animDuration, 0), 1);

    if (this.state === "sliding-in") {
      const eased = easeOutCubic(t);
      this.progress = this.animStartProgress + (this.animTargetProgress - this.animStartProgress) * eased;
      if (t >= 1.0) {
        this.progress = 1.0;
        this.state = "settled";
      }
    } else if (this.state === "sliding-out") {
      const eased = easeInOutCubic(t);
      this.progress = this.animStartProgress + (this.animTargetProgress - this.animStartProgress) * eased;
      if (t >= 1.0) {
        this.progress = 0.0;
        this.state = "hidden";
      }
    }

    return this.progress;
  }
}

// Global shared paper controller instance so canvas and interactions can coordinate
export const globalPaperController = new PaperController();
