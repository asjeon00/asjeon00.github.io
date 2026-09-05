import { LIGHT_PIPELINE_TUNING } from "./config";
import { runtimeWallExtent } from "../../runtime/uniforms";
import type { PrismRuntime } from "../../runtime/types";
import {
  DEFAULT_GRADIENT_CONTROLS,
  DEFAULT_WIND_CONTROLS,
  PRISM_CENTROID,
  PRISM_LIGHT_TONE_MAPPING_CODES,
  PRISM_SIDE,
} from "../../types";
import { presentationRevealUniforms } from "../shared/presentation/index";

function parseHexColor(
  hex: string | undefined,
  fallback: readonly [number, number, number]
): readonly [number, number, number] {
  if (!hex) return fallback;
  const match = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!match) return fallback;
  return [
    Number.parseInt(match[1]!, 16) / 255,
    Number.parseInt(match[2]!, 16) / 255,
    Number.parseInt(match[3]!, 16) / 255,
  ];
}

export function lightWallUniforms(
  runtime: PrismRuntime
): Record<string, unknown> {
  const tuning = LIGHT_PIPELINE_TUNING.wall;
  const controls = runtime.controls.lightMode.wall;
  const gradient = runtime.controls.gradient ?? DEFAULT_GRADIENT_CONTROLS;
  const wind = runtime.controls.wind ?? DEFAULT_WIND_CONTROLS;
  const wallColor = parseHexColor(runtime.controls.wallColor, [0.514, 0.514, 0.514]);
  const colorHighlight = parseHexColor(gradient.colorHighlight, [0.855, 0.886, 0.937]);
  const colorMid = parseHexColor(gradient.colorMid, [1.0, 1.0, 1.0]);
  const colorShadow = parseHexColor(gradient.colorShadow, [0.514, 0.514, 0.514]);

  const normalScale =
    gradient.graniteNormalStrength != null
      ? gradient.graniteNormalStrength / 0.12
      : 1;

  return {
    viewProjection: runtime.view.viewProjection,
    wallHalfExtent: runtimeWallExtent(runtime),
    wallColor,
    prismCenter: PRISM_CENTROID,
    // A more grazing upper-left key makes the plaster normals readable while
    // the baked HDR blobs remain responsible for the white illumination peaks.
    lightDirection: [-0.48, 0.56, 0.68],
    materialWorldScale: PRISM_SIDE * (gradient.graniteScale || tuning.materialScale),
    normalStrength: tuning.normalStrength * controls.normalStrength * normalScale,
    microNormalFrequency: tuning.microNormalFrequency,
    microNormalStrength: tuning.microNormalStrength * controls.normalStrength * normalScale,
    ambient: tuning.ambient,
    ambientLightStrength: controls.ambientFill,
    globalLightTransfer: controls.lightmapGamma,
    shadowContrast: controls.shadowContrast,
    shadowPivot: controls.shadowPivot,
    shadowFloor: controls.shadowFloor,
    highlightExposure: controls.highlightExposure,
    // The broad cast shadow is a geometry draw. Preserve only the separately
    // baked contact/AO channel in the wall material composition.
    prismShadowStrength: 0,
    prismAoStrength: tuning.prismAoStrength,
    groundingScale: PRISM_SIDE * tuning.groundingScale,

    colorHighlight,
    colorMid,
    colorShadow,
    spotCenter: [gradient.spotCenterX, gradient.spotCenterY],
    spotParams: [gradient.spotRadius, gradient.spotGlow],
    darkFalloff: [gradient.darkFalloffStart, gradient.darkFalloffEnd],
    gridParams: [
      gradient.gridSpacing,
      gradient.gridLineWidth,
      gradient.gridOpacity,
      gradient.boardOffsetX ?? 0,
    ],
    surfaceParams: [
      gradient.vignette,
      gradient.graniteRoughness,
      gradient.directExposure,
      gradient.lightmapMix,
    ],

    windParams: [
      wind.speed,
      wind.strength,
      wind.rustleFreq,
      0,
    ],
    cursorParams: [
      gradient.gridDrawProgress ?? 1.0,
      0,
      0,
      0,
    ],
    timeParams: [
      runtime.clockTime ?? 0,
      wind.leafShadowStrength,
      wind.leafShimmer,
      wind.enabled ? 1 : 0,
    ],
  };
}

export function lightCausticUniforms(
  runtime: PrismRuntime
): Record<string, unknown> {
  const tuning = LIGHT_PIPELINE_TUNING.caustic;
  const controls = runtime.controls.lightMode.caustic;
  const wall = LIGHT_PIPELINE_TUNING.wall;
  const wallControls = runtime.controls.lightMode.wall;
  return {
    strength: controls.strength,
    coverage: controls.coverage,
    farDesaturation: tuning.farDesaturation,
    farBrightness: tuning.farBrightness,
    // Light-mesh travel is already normalized from the prism to the wall edge.
    travelScale: tuning.travelScale,
    falloffRateScale: tuning.falloffRateScale,
    falloffPowerScale: tuning.falloffPowerScale,
    materialWorldScale: PRISM_SIDE * wall.materialScale,
    normalStrength: wall.normalStrength * wallControls.normalStrength,
    microNormalFrequency: wall.microNormalFrequency,
    microNormalStrength:
      wall.microNormalStrength * wallControls.normalStrength,
    normalInfluence: controls.normalInfluence,
    normalElevation: controls.normalElevation,
  };
}

export function lightPresentUniforms(
  runtime: PrismRuntime,
  revealProgress = 1
): Record<string, unknown> {
  const output = runtime.controls.lightMode.output;
  return {
    ...presentationRevealUniforms("light", revealProgress),
    exposure: output.exposure,
    toneMapping: PRISM_LIGHT_TONE_MAPPING_CODES[output.toneMapping],
  };
}
