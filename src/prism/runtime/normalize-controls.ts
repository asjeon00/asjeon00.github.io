import {
  DEFAULT_PRISM_CONTROLS,
  DEFAULT_CAMERA_PITCH_DEGREES,
  DEFAULT_CAMERA_YAW_DEGREES,
  PRISM_BEAM_MOUSE_Y_RANGES,
  PRISM_DISPERSION_PRESETS,
  PRISM_LIGHT_FADE_RANGES,
  PRISM_LIGHT_MODE_RANGES,
  PRISM_LIGHT_TONE_MAPPING_ORDER,
  PRISM_SPECTRAL_DISPERSION_RANGES,
  clampBeamWidth,
  clampCameraFov,
  type GlassControls,
  type GlassReflectionControls,
  type GlassTransmissionControls,
  type LightToneMapping,
  type PrismControls,
  type PrismTheme,
} from "../types";

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isLightToneMapping = (value: unknown): value is LightToneMapping =>
  PRISM_LIGHT_TONE_MAPPING_ORDER.some((candidate) => candidate === value);

type LegacyGlassControls = Omit<
  Partial<GlassControls>,
  "transmission" | "reflection"
> & {
  readonly transmission?: Partial<
    Record<PrismTheme, Partial<GlassTransmissionControls>>
  >;
  readonly reflection?: Partial<
    Record<PrismTheme, Partial<GlassReflectionControls>>
  >;
  readonly ior?: number;
  readonly absorption?: readonly [number, number, number];
  readonly reflectionStrength?: number;
  readonly environmentExposure?: number;
};

function normalizeTransmission(
  glass: LegacyGlassControls,
  mode: PrismTheme,
  defaults: GlassTransmissionControls
): GlassTransmissionControls {
  const input = glass.transmission?.[mode];
  // Pre-split Fast Refresh state described one dark material. Migrate those
  // fields into dark only; light deliberately keeps its clear-glass defaults.
  const legacyIor = mode === "dark" ? glass.ior : undefined;
  const legacyAbsorption = mode === "dark" ? glass.absorption : undefined;
  const absorption =
    input?.absorption ?? legacyAbsorption ?? defaults.absorption;
  return {
    ior: finite(input?.ior ?? legacyIor, defaults.ior),
    absorption: [
      finite(absorption[0], defaults.absorption[0]),
      finite(absorption[1], defaults.absorption[1]),
      finite(absorption[2], defaults.absorption[2]),
    ],
  };
}

function normalizeReflection(
  glass: LegacyGlassControls,
  mode: PrismTheme,
  defaults: GlassReflectionControls
): GlassReflectionControls {
  const input = glass.reflection?.[mode];
  // The former shared fields describe the established dark look. Light keeps
  // its new full-strength environment defaults during Fast Refresh migration.
  const legacyStrength = mode === "dark" ? glass.reflectionStrength : undefined;
  const legacyExposure =
    mode === "dark" ? glass.environmentExposure : undefined;
  return {
    reflectionStrength: finite(
      input?.reflectionStrength ?? legacyStrength,
      defaults.reflectionStrength
    ),
    environmentExposure: finite(
      input?.environmentExposure ?? legacyExposure,
      defaults.environmentExposure
    ),
  };
}

/** Normalizes GUI/Fast Refresh input into the complete runtime schema. */
export function normalizeControls(controls: PrismControls): PrismControls {
  const defaults = DEFAULT_PRISM_CONTROLS;
  const inputGlass = (controls.glass ?? defaults.glass) as LegacyGlassControls;
  const inputPostprocess = controls.postprocess ?? defaults.postprocess;
  const inputLightFade = controls.lightFade ?? defaults.lightFade;
  const inputLightMode = controls.lightMode ?? defaults.lightMode;
  const inputBeamMouseY = controls.beamMouseY ?? defaults.beamMouseY;
  const legacyLightFade = inputLightFade as typeof inputLightFade & {
    rainbowFalloff?: number;
  };
  const inputDispersion =
    controls.spectralDispersion ??
    PRISM_DISPERSION_PRESETS[controls.dispersion ?? defaults.dispersion];

  return {
    ...controls,
    cameraFov: clampCameraFov(controls.cameraFov ?? defaults.cameraFov),
    beamWidth: clampBeamWidth(controls.beamWidth ?? defaults.beamWidth),
    beamMouseY: {
      top: clamp(
        finite(inputBeamMouseY.top, defaults.beamMouseY.top),
        PRISM_BEAM_MOUSE_Y_RANGES.top.min,
        PRISM_BEAM_MOUSE_Y_RANGES.top.max
      ),
      bottom: clamp(
        finite(inputBeamMouseY.bottom, defaults.beamMouseY.bottom),
        PRISM_BEAM_MOUSE_Y_RANGES.bottom.min,
        PRISM_BEAM_MOUSE_Y_RANGES.bottom.max
      ),
    },
    spectralDispersion: {
      base: clamp(
        finite(
          inputDispersion.base,
          PRISM_DISPERSION_PRESETS[defaults.dispersion].base
        ),
        PRISM_SPECTRAL_DISPERSION_RANGES.base.min,
        PRISM_SPECTRAL_DISPERSION_RANGES.base.max
      ),
      strength: clamp(
        finite(
          inputDispersion.strength,
          PRISM_DISPERSION_PRESETS[defaults.dispersion].strength
        ),
        PRISM_SPECTRAL_DISPERSION_RANGES.strength.min,
        PRISM_SPECTRAL_DISPERSION_RANGES.strength.max
      ),
    },
    lightFade: {
      beamOpacity: clamp(
        finite(inputLightFade.beamOpacity, defaults.lightFade.beamOpacity),
        PRISM_LIGHT_FADE_RANGES.beamOpacity.min,
        PRISM_LIGHT_FADE_RANGES.beamOpacity.max
      ),
      edgeFalloff: clamp(
        finite(inputLightFade.edgeFalloff, defaults.lightFade.edgeFalloff),
        PRISM_LIGHT_FADE_RANGES.edgeFalloff.min,
        PRISM_LIGHT_FADE_RANGES.edgeFalloff.max
      ),
      rainbowFalloffRate: clamp(
        finite(
          inputLightFade.rainbowFalloffRate ?? legacyLightFade.rainbowFalloff,
          defaults.lightFade.rainbowFalloffRate
        ),
        PRISM_LIGHT_FADE_RANGES.rainbowFalloffRate.min,
        PRISM_LIGHT_FADE_RANGES.rainbowFalloffRate.max
      ),
      rainbowFalloffPower: clamp(
        finite(
          inputLightFade.rainbowFalloffPower,
          defaults.lightFade.rainbowFalloffPower
        ),
        PRISM_LIGHT_FADE_RANGES.rainbowFalloffPower.min,
        PRISM_LIGHT_FADE_RANGES.rainbowFalloffPower.max
      ),
    },
    lightMode: {
      wall: {
        normalStrength: clamp(
          finite(
            inputLightMode.wall?.normalStrength,
            defaults.lightMode.wall.normalStrength
          ),
          PRISM_LIGHT_MODE_RANGES.wall.normalStrength.min,
          PRISM_LIGHT_MODE_RANGES.wall.normalStrength.max
        ),
        lightmapGamma: clamp(
          finite(
            inputLightMode.wall?.lightmapGamma,
            defaults.lightMode.wall.lightmapGamma
          ),
          PRISM_LIGHT_MODE_RANGES.wall.lightmapGamma.min,
          PRISM_LIGHT_MODE_RANGES.wall.lightmapGamma.max
        ),
        shadowContrast: clamp(
          finite(
            inputLightMode.wall?.shadowContrast,
            defaults.lightMode.wall.shadowContrast
          ),
          PRISM_LIGHT_MODE_RANGES.wall.shadowContrast.min,
          PRISM_LIGHT_MODE_RANGES.wall.shadowContrast.max
        ),
        shadowPivot: clamp(
          finite(
            inputLightMode.wall?.shadowPivot,
            defaults.lightMode.wall.shadowPivot
          ),
          PRISM_LIGHT_MODE_RANGES.wall.shadowPivot.min,
          PRISM_LIGHT_MODE_RANGES.wall.shadowPivot.max
        ),
        shadowFloor: clamp(
          finite(
            inputLightMode.wall?.shadowFloor,
            defaults.lightMode.wall.shadowFloor
          ),
          PRISM_LIGHT_MODE_RANGES.wall.shadowFloor.min,
          PRISM_LIGHT_MODE_RANGES.wall.shadowFloor.max
        ),
        highlightExposure: clamp(
          finite(
            inputLightMode.wall?.highlightExposure,
            defaults.lightMode.wall.highlightExposure
          ),
          PRISM_LIGHT_MODE_RANGES.wall.highlightExposure.min,
          PRISM_LIGHT_MODE_RANGES.wall.highlightExposure.max
        ),
        ambientFill: clamp(
          finite(
            inputLightMode.wall?.ambientFill,
            defaults.lightMode.wall.ambientFill
          ),
          PRISM_LIGHT_MODE_RANGES.wall.ambientFill.min,
          PRISM_LIGHT_MODE_RANGES.wall.ambientFill.max
        ),
      },
      caustic: {
        strength: clamp(
          finite(
            inputLightMode.caustic?.strength,
            defaults.lightMode.caustic.strength
          ),
          PRISM_LIGHT_MODE_RANGES.caustic.strength.min,
          PRISM_LIGHT_MODE_RANGES.caustic.strength.max
        ),
        coverage: clamp(
          finite(
            inputLightMode.caustic?.coverage,
            defaults.lightMode.caustic.coverage
          ),
          PRISM_LIGHT_MODE_RANGES.caustic.coverage.min,
          PRISM_LIGHT_MODE_RANGES.caustic.coverage.max
        ),
        normalInfluence: clamp(
          finite(
            inputLightMode.caustic?.normalInfluence,
            defaults.lightMode.caustic.normalInfluence
          ),
          PRISM_LIGHT_MODE_RANGES.caustic.normalInfluence.min,
          PRISM_LIGHT_MODE_RANGES.caustic.normalInfluence.max
        ),
        normalElevation: clamp(
          finite(
            inputLightMode.caustic?.normalElevation,
            defaults.lightMode.caustic.normalElevation
          ),
          PRISM_LIGHT_MODE_RANGES.caustic.normalElevation.min,
          PRISM_LIGHT_MODE_RANGES.caustic.normalElevation.max
        ),
      },
      output: {
        exposure: clamp(
          finite(
            inputLightMode.output?.exposure,
            defaults.lightMode.output.exposure
          ),
          PRISM_LIGHT_MODE_RANGES.output.exposure.min,
          PRISM_LIGHT_MODE_RANGES.output.exposure.max
        ),
        toneMapping: isLightToneMapping(inputLightMode.output?.toneMapping)
          ? inputLightMode.output.toneMapping
          : defaults.lightMode.output.toneMapping,
      },
    },
    gradient: {
      colorHighlight:
        controls.gradient?.colorHighlight ?? defaults.gradient.colorHighlight,
      colorMid: controls.gradient?.colorMid ?? defaults.gradient.colorMid,
      colorShadow:
        controls.gradient?.colorShadow ?? defaults.gradient.colorShadow,
      spotCenterX: finite(
        controls.gradient?.spotCenterX,
        defaults.gradient.spotCenterX
      ),
      spotCenterY: finite(
        controls.gradient?.spotCenterY,
        defaults.gradient.spotCenterY
      ),
      spotRadius: Math.max(
        finite(controls.gradient?.spotRadius, defaults.gradient.spotRadius),
        0.05
      ),
      spotGlow: Math.max(
        finite(controls.gradient?.spotGlow, defaults.gradient.spotGlow),
        0.05
      ),
      darkFalloffStart: finite(
        controls.gradient?.darkFalloffStart,
        defaults.gradient.darkFalloffStart
      ),
      darkFalloffEnd: finite(
        controls.gradient?.darkFalloffEnd,
        defaults.gradient.darkFalloffEnd
      ),
      vignette: Math.max(
        finite(controls.gradient?.vignette, defaults.gradient.vignette),
        0
      ),
      gridSpacing: Math.max(
        finite(controls.gradient?.gridSpacing, defaults.gradient.gridSpacing),
        0.01
      ),
      gridLineWidth: Math.max(
        finite(
          controls.gradient?.gridLineWidth,
          defaults.gradient.gridLineWidth
        ),
        0.0001
      ),
      gridOpacity: clamp(
        finite(controls.gradient?.gridOpacity, defaults.gradient.gridOpacity),
        0,
        1
      ),
      boardOffsetX: finite(
        controls.gradient?.boardOffsetX,
        defaults.gradient.boardOffsetX
      ),
      graniteScale: Math.max(
        finite(controls.gradient?.graniteScale, defaults.gradient.graniteScale),
        0.1
      ),
      graniteRoughness: clamp(
        finite(
          controls.gradient?.graniteRoughness,
          defaults.gradient.graniteRoughness
        ),
        0,
        1
      ),
      graniteNormalStrength: clamp(
        finite(
          controls.gradient?.graniteNormalStrength,
          defaults.gradient.graniteNormalStrength
        ),
        0,
        2
      ),
      directExposure: Math.max(
        finite(
          controls.gradient?.directExposure,
          defaults.gradient.directExposure
        ),
        0
      ),
      lightmapMix: clamp(
        finite(controls.gradient?.lightmapMix, defaults.gradient.lightmapMix),
        0,
        1
      ),
      gridDrawProgress: clamp(
        finite(
          controls.gradient?.gridDrawProgress,
          defaults.gradient.gridDrawProgress ?? 1.0
        ),
        0,
        1
      ),
    },
    wind: {
      enabled: controls.wind?.enabled ?? defaults.wind.enabled,
      speed: Math.max(finite(controls.wind?.speed, defaults.wind.speed), 0.01),
      strength: Math.max(
        finite(controls.wind?.strength, defaults.wind.strength),
        0
      ),
      rustleFreq: Math.max(
        finite(controls.wind?.rustleFreq, defaults.wind.rustleFreq),
        0.1
      ),
      leafShadowStrength: clamp(
        finite(
          controls.wind?.leafShadowStrength,
          defaults.wind.leafShadowStrength
        ),
        0,
        1
      ),
      leafShimmer: clamp(
        finite(controls.wind?.leafShimmer, defaults.wind.leafShimmer),
        0,
        1
      ),
    },
    cameraPitch: clamp(
      finite(controls.cameraPitch, defaults.cameraPitch ?? DEFAULT_CAMERA_PITCH_DEGREES),
      -80,
      80
    ),
    cameraYaw: clamp(
      finite(controls.cameraYaw, defaults.cameraYaw ?? DEFAULT_CAMERA_YAW_DEGREES),
      -180,
      180
    ),
    cameraOrbitEnabled: controls.cameraOrbitEnabled ?? defaults.cameraOrbitEnabled ?? false,
    wireframe: controls.wireframe ?? defaults.wireframe,
    lightWireframe: controls.lightWireframe ?? defaults.lightWireframe,
    environmentDebug: controls.environmentDebug ?? defaults.environmentDebug,
    glass: {
      transmission: {
        dark: normalizeTransmission(
          inputGlass,
          "dark",
          defaults.glass.transmission.dark
        ),
        light: normalizeTransmission(
          inputGlass,
          "light",
          defaults.glass.transmission.light
        ),
      },
      reflection: {
        dark: normalizeReflection(
          inputGlass,
          "dark",
          defaults.glass.reflection.dark
        ),
        light: normalizeReflection(
          inputGlass,
          "light",
          defaults.glass.reflection.light
        ),
      },
    },
    postprocess: {
      bloomStrength: finite(
        inputPostprocess.bloomStrength,
        defaults.postprocess.bloomStrength
      ),
      bloomThreshold: finite(
        inputPostprocess.bloomThreshold,
        defaults.postprocess.bloomThreshold
      ),
      bloomRadius: finite(
        inputPostprocess.bloomRadius,
        defaults.postprocess.bloomRadius
      ),
    },
  };
}
