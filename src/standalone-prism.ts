/**
 * Standalone 3D Hero Prism Setup (vgpu.sh reverse-engineered reproduction)
 *
 * This module demonstrates how to directly initialize, configure, and run
 * the WebGPU 3D Glass Prism and spectral dispersion simulation on any HTMLCanvasElement
 * without requiring React or any UI framework.
 *
 * Graphics Architecture Overview:
 * 1. Procedural Geometry:
 *    - Equilateral triangular prism with 0.8mm filleted edges and rounded bevel caps (prism-mesh.ts).
 *    - Deterministic spectral light ribbons connecting 64 sample wavelengths across the visible spectrum (light-mesh.ts).
 *    - 2,200 floating volumetric dust particles drifting through the ray corridor (dust.wgsl).
 * 2. Optical Physics Simulation:
 *    - Cauchy's dispersion formula: n(λ) = A + B / λ^2 for wavelength-dependent refractive indices.
 *    - Snell's Law refraction at entry and exit faces.
 *    - Internal reflection bouncing and Fresnel reflection / transmission weighting.
 * 3. Multi-Pass WebGPU Render Pipeline:
 *    - Additive Light Pass (spectral rainbow fan)
 *    - Volumetric Dust Pass
 *    - Downsample Pyramid
 *    - Glass Back-Face & Front-Face Passes (Fresnel reflection, transmission)
 *    - HDR Bloom Extraction + 5-Level Separable Blur Pyramid + Additive Composite
 *    - Presentation Pass (ACES filmic tone mapping + blue-noise dithering to sRGB canvas)
 * 4. Camera & Interactivity:
 *    - Orbiting perspective camera responding to pointer movement with subtle ±5° parallax.
 *    - Responsive framing calculating dynamic wall coverage to eliminate empty borders.
 */

import { createRenderer, type PrismRenderer } from './prism/renderer'
import { DEFAULT_PRISM_CONTROLS, type PrismControls } from './prism/types'
import type { PrismPipelineMode } from './prism/pipelines/types'

export interface StandalonePrismOptions {
  /** The target HTMLCanvasElement to render WebGPU graphics into. */
  canvas: HTMLCanvasElement
  /** Optional DOM element used to frame/anchor the triangular prism within the hero layout. */
  framingElement?: HTMLElement
  /** Pipeline theme mode: 'dark' (default hero) or 'light'. */
  mode?: PrismPipelineMode
  /** Initial optical and material controls. */
  controls?: Partial<PrismControls>
  /** Whether to enable live GPU debug previews for pipeline DAG graph. */
  debugPreviews?: boolean
  /** Error callback in case WebGPU is unsupported or device creation fails. */
  onError?: (error: unknown) => void
}

/**
 * Initializes and starts the standalone WebGPU 3D Hero Prism renderer.
 *
 * @example
 * ```ts
 * const canvas = document.querySelector('canvas')!;
 * const prism = initStandalonePrism({ canvas });
 * // Later: prism.dispose();
 * ```
 */
export function initStandalonePrism(options: StandalonePrismOptions): PrismRenderer {
  const mode = options.mode ?? 'dark'
  const initialControls: PrismControls = {
    ...DEFAULT_PRISM_CONTROLS,
    wallColor: mode === 'dark' ? '#000000' : '#d2ccc2',
    ...options.controls,
  }

  const renderer = createRenderer({
    canvas: options.canvas,
    framingElement: options.framingElement,
    initialMode: mode,
    initialQuality: 'auto',
    initialControls,
    debugPreviews: options.debugPreviews ?? false,
    onError: options.onError ?? ((err) => console.error('WebGPU Prism initialization failed:', err)),
  })

  // Log confirmation when WebGPU pipeline is compiled and prewarmed
  renderer.ready
    .then(() => {
      console.log('✨ WebGPU 3D Prism initialized and prewarmed successfully!')
    })
    .catch((err) => {
      console.warn('WebGPU Prism encountered a setup issue:', err)
    })

  return renderer
}

export default initStandalonePrism
