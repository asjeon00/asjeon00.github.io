/** Centralized look-development values measured against the generated reference. */
export const LIGHT_PIPELINE_TUNING = Object.freeze({
  wall: {
    materialScale: 1.8,
    normalStrength: 0.12,
    microNormalFrequency: 8,
    microNormalStrength: 0.25,
    ambient: 0.55,
    prismShadowStrength: 1,
    prismAoStrength: 1,
    groundingScale: 1.2,
  },
  caustic: {
    farDesaturation: 0.04,
    farBrightness: 0.02,
    travelScale: 1,
    falloffRateScale: 0.12,
    falloffPowerScale: 0.5,
  },
});
