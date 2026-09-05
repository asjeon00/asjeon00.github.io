import { srgbToLinear3 } from "@vgpu/wgsl-std/color";
import { evaluateGlassGrounding } from "../../shared/glass-grounding.wgsl";
import { evaluateWallNormalsFromMaterial } from "./wall-normal.wgsl";

const GLOBAL_LIGHT_MASK_ASPECT = 1.5;

export struct LightWall {
  viewProjection: mat4x4f,
  wallHalfExtent: vec2f,
  wallColor: vec3f,
  prismCenter: vec2f,
  lightDirection: vec3f,
  materialWorldScale: f32,
  normalStrength: f32,
  microNormalFrequency: f32,
  microNormalStrength: f32,
  ambient: f32,
  ambientLightStrength: f32,
  globalLightTransfer: f32,
  shadowContrast: f32,
  shadowPivot: f32,
  shadowFloor: f32,
  highlightExposure: f32,
  prismShadowStrength: f32,
  prismAoStrength: f32,
  groundingScale: f32,

  // Tunable Gradient & Backdrop parameters
  colorHighlight: vec3f,
  colorMid: vec3f,
  colorShadow: vec3f,
  spotCenter: vec2f,
  spotParams: vec2f,      // x: spotRadius, y: spotGlow
  darkFalloff: vec2f,     // x: start, y: end
  gridParams: vec4f,      // x: spacing, y: lineWidth, z: opacity, w: boardOffsetX
  surfaceParams: vec4f,   // x: vignette, y: graniteRoughness, z: directExposure, w: lightmapMix

  // Wind & Leaf Shadow Movement
  windParams: vec4f,      // x: speed, y: strength, z: rustleFreq, w: cursorInfluence
  cursorParams: vec4f,    // xy: cursor (uv), zw: cursorVelocity
  timeParams: vec4f,      // x: time (seconds), y: leafShadowStrength, z: shimmerStrength, w: enabled (1.0/0.0)
}

export struct WallSample {
  albedo: vec3f,
  largeNormal: vec3f,
  microNormal: vec3f,
  normal: vec3f,
  roughness: f32,
  globalLight: f32,
  prismShadow: f32,
  prismAo: f32,
  composed: vec3f,
}

export fn wallPoint(params: LightWall, uv: vec2f) -> vec2f {
  return (uv - vec2f(0.5)) * vec2f(2.0, -2.0) * params.wallHalfExtent;
}

fn shadowContrastCurve(value: f32, contrast: f32, pivot: f32) -> f32 {
  let safePivot = clamp(pivot, 0.001, 0.999);
  let safeContrast = max(contrast, 0.001);
  if (value < safePivot) {
    return safePivot * pow(value / safePivot, safeContrast);
  }
  return 1.0 - (1.0 - safePivot) * pow(
    (1.0 - value) / (1.0 - safePivot),
    safeContrast,
  );
}

export fn evaluateLeafWindOffset(
  worldPos: vec2f,
  time: f32,
  windParams: vec4f,
) -> vec2f {
  let speed = windParams.x;
  let strength = windParams.y;
  let rustleFreq = windParams.z;

  // Slow, natural pendulum time base (~0.25 - 0.35 Hz)
  let t = time * speed * 0.85;

  // 1. Natural inverted-pendulum branch sway
  // Two closely related harmonic modes create realistic natural breathing and gentle gust/lull cycles
  let sway1 = sin(t * 0.75);
  let sway2 = sin(t * 1.25 + 1.1) * 0.32;
  let mainSway = sway1 + sway2;

  // Dominant wind direction (gentle diagonal breeze)
  let windDir = normalize(vec2f(0.85, 0.48));
  // Perpendicular component forms a subtle, natural elliptical Lissajous motion
  let perpDir = vec2f(-windDir.y, windDir.x);
  let perpSway = cos(t * 0.75 + 0.5) * 0.20;

  // Smooth, macroscopic spatial modulation without local rubbery stretching
  let flex = 0.92 + 0.08 * sin(worldPos.x * 0.25 + worldPos.y * 0.30);
  let branchSway = (windDir * mainSway + perpDir * perpSway) * flex * (0.0070 * strength);

  // 2. Extremely subtle, subdued leaf micro-deflection (imperceptible unless rustleFreq is raised)
  let leafPhase = t * (rustleFreq * 0.9) + worldPos.x * 0.8 + worldPos.y * 0.6;
  let leafRustle = vec2f(sin(leafPhase), cos(leafPhase * 1.05)) * (0.0008 * strength);

  return branchSway + leafRustle;
}

export fn evaluateWall(
  worldPosition: vec2f,
  screenUv: vec2f,
  params: LightWall,
  wallMaterial: texture_2d<f32>,
  wallLighting: texture_2d<f32>,
  materialSampler: sampler,
) -> WallSample {
  let material = textureSample(
    wallMaterial,
    materialSampler,
    worldPosition / max(params.materialWorldScale, 0.001),
  );
  let normals = evaluateWallNormalsFromMaterial(
    worldPosition,
    params.materialWorldScale,
    params.normalStrength,
    params.microNormalFrequency,
    params.microNormalStrength,
    material,
    wallMaterial,
    materialSampler,
  );
  let largeNormal = normals.large;
  let microNormal = normals.micro;
  let normal = normals.combined;
  let groundingOffset = vec2f(
    worldPosition.x - params.prismCenter.x,
    params.prismCenter.y - worldPosition.y,
  );
  let groundingUv = clamp(
    groundingOffset / params.groundingScale + vec2f(0.5),
    vec2f(0.001),
    vec2f(0.999),
  );

  let wallAspect = params.wallHalfExtent.x / max(params.wallHalfExtent.y, 0.001);
  var baseLightingUv = screenUv;
  if (wallAspect > GLOBAL_LIGHT_MASK_ASPECT) {
    baseLightingUv.y = screenUv.y * GLOBAL_LIGHT_MASK_ASPECT / wallAspect;
  } else {
    baseLightingUv.x =
      (screenUv.x - 0.5) * wallAspect / GLOBAL_LIGHT_MASK_ASPECT + 0.5;
  }
  baseLightingUv = clamp(baseLightingUv, vec2f(0.001), vec2f(0.999));

  // Dynamic wind-driven leaf shadow UV offset
  let windEnabled = params.timeParams.w > 0.5;
  var windOffset = vec2f(0.0);
  if (windEnabled) {
    windOffset = evaluateLeafWindOffset(
      worldPosition,
      params.timeParams.x,
      params.windParams,
    );
  }
  let lightingUv = clamp(baseLightingUv + windOffset, vec2f(0.001), vec2f(0.999));

  let globalLight = textureSample(wallLighting, materialSampler, lightingUv).r;
  let globalLightLinear = pow(
    clamp(globalLight, 0.0, 1.0),
    max(params.globalLightTransfer, 0.001),
  );

  let shimmerStrength = params.timeParams.z;
  var shimmer = 1.0;
  if (windEnabled && shimmerStrength > 0.001) {
    shimmer = 1.0 + sin(params.timeParams.x * 1.2 + worldPosition.x * 0.4 + worldPosition.y * 0.4) * (0.015 * shimmerStrength);
  }
  let globalLightShaped = shadowContrastCurve(
    globalLightLinear,
    params.shadowContrast,
    params.shadowPivot,
  ) * shimmer;
  let grounding = textureSample(wallLighting, materialSampler, groundingUv);
  let glassGrounding = evaluateGlassGrounding(grounding.g, grounding.b);
  let prismShadow = mix(1.0, glassGrounding.x, params.prismShadowStrength);
  let prismAo = mix(1.0, glassGrounding.y, params.prismAoStrength);
  let lightFacing = max(dot(normal, normalize(params.lightDirection)), 0.0);
  let diffuse = mix(
    params.ambient,
    1.0,
    lightFacing,
  );
  let halfDirection = normalize(normalize(params.lightDirection) + vec3f(0.0, 0.0, 1.0));
  let specularPower = mix(64.0, 16.0, material.a);
  let specular = pow(max(dot(normal, halfDirection), 0.0), specularPower)
    * mix(0.16, 0.03, material.a);

  // 1. Spline Studio Lighting Gradient (tunable parameters)
  let spotRadius = max(params.spotParams.x, 0.05);
  let spotGlowRate = max(params.spotParams.y, 0.05);
  let spotDist = length((worldPosition - params.spotCenter) * vec2f(0.85, 1.15) / spotRadius);
  let spotGlow = exp(-spotDist * spotDist * spotGlowRate);
  let darkFalloff = smoothstep(params.darkFalloff.x, params.darkFalloff.y, worldPosition.x);
  let vignetteRadius = 2.8 * max(params.surfaceParams.x, 0.1);
  let studioVignette = smoothstep(vignetteRadius, 0.5, length(worldPosition * vec2f(0.65, 0.95)));
  let studioSweep = clamp(mix(0.08, 0.95, darkFalloff) * 0.7 + spotGlow * 0.55, 0.0, 1.0) * studioVignette;

  let highlightLin = srgbToLinear3(params.colorHighlight);
  let midLin = srgbToLinear3(params.colorMid);
  let shadowLin = srgbToLinear3(params.colorShadow);

  let studioColor = mix(
    shadowLin,
    mix(midLin, highlightLin, smoothstep(0.25, 0.85, studioSweep)),
    smoothstep(0.03, 0.45, studioSweep),
  );

  // 2. Baduk / Go Board 19x19 Grid & Star Points (Hoshi)
  let gridSpacing = max(params.gridParams.x, 0.01);
  let cellAspect = 1.07;
  let cellScale = vec2f(gridSpacing, gridSpacing * cellAspect);
  let boardOffset = vec2f(params.gridParams.w, 0.0);
  let boardPos = worldPosition - boardOffset;
  let boardCoord = boardPos / cellScale;
  let isInsideBoard = abs(boardCoord.x) <= 9.02 && abs(boardCoord.y) <= 9.02;

  let distToLineX = abs(boardCoord.x - round(boardCoord.x)) * gridSpacing;
  let distToLineY = abs(boardCoord.y - round(boardCoord.y)) * (gridSpacing * cellAspect);
  let lineWidth = max(params.gridParams.y, 0.0006);

  let drawProgress = clamp(params.cursorParams.x, 0.0, 1.0);
  let isFullDraw = drawProgress >= 0.999;

  var gridLine = 0.0;
  var hoshiDot = 0.0;

  if (isFullDraw) {
    let distToGrid = min(distToLineX, distToLineY);
    gridLine = (1.0 - smoothstep(0.0, lineWidth * 1.5, distToGrid)) * select(0.0, 1.0, isInsideBoard);

    // Outer perimeter framing line of the 19x19 board
    let borderEdgeX = abs(abs(boardCoord.x) - 9.0) * gridSpacing;
    let borderEdgeY = abs(abs(boardCoord.y) - 9.0) * (gridSpacing * cellAspect);
    let isOuterEdge = (borderEdgeX < lineWidth * 1.8 || borderEdgeY < lineWidth * 1.8) && isInsideBoard;
    gridLine = max(gridLine, select(0.0, 1.0, isOuterEdge));

    // 9 Traditional Star Points (Hoshi dots: Tengen at 0,0, corners at +/-6,+/-6, edges at 0,+/-6 & +/-6,0)
    let nearestInter = round(boardCoord);
    let isHoshiX = nearestInter.x == 0.0 || abs(nearestInter.x) == 6.0;
    let isHoshiY = nearestInter.y == 0.0 || abs(nearestInter.y) == 6.0;
    if (isHoshiX && isHoshiY && isInsideBoard) {
      let hoshiCenter = nearestInter * cellScale + boardOffset;
      let distHoshi = length(worldPosition - hoshiCenter);
      let hoshiRadius = 0.011 * (gridSpacing / 0.28);
      hoshiDot = 1.0 - smoothstep(hoshiRadius * 0.75, hoshiRadius * 1.15, distHoshi);
    }
  } else if (isInsideBoard && drawProgress > 0.001) {
    // Staggered row line drawing: each row is slightly staggered behind the next one drawn
    let staggerFraction = 0.45;
    let strokeDuration = 1.0 - staggerFraction;

    // Row drawing: top row (+9) down to bottom row (-9)
    let rowNorm = clamp((9.0 - round(boardCoord.y)) / 18.0, 0.0, 1.0);
    let rowStart = rowNorm * staggerFraction;
    let rowProgress = clamp((drawProgress - rowStart) / strokeDuration, 0.0, 1.0);
    let xNorm = clamp((boardCoord.x + 9.0) / 18.0, 0.0, 1.0);
    let rowDrawn = smoothstep(0.0, 0.025, rowProgress - xNorm);
    let horizLine = (1.0 - smoothstep(0.0, lineWidth * 1.5, distToLineY)) * rowDrawn;

    // Column drawing: left column (-9) to right column (+9), sweeping downward
    let colNorm = clamp((round(boardCoord.x) + 9.0) / 18.0, 0.0, 1.0);
    let colStart = colNorm * staggerFraction;
    let colProgress = clamp((drawProgress - colStart) / strokeDuration, 0.0, 1.0);
    let yNorm = clamp((9.0 - boardCoord.y) / 18.0, 0.0, 1.0);
    let colDrawn = smoothstep(0.0, 0.025, colProgress - yNorm);
    let vertLine = (1.0 - smoothstep(0.0, lineWidth * 1.5, distToLineX)) * colDrawn;

    gridLine = max(horizLine, vertLine);

    // Outer perimeter framing lines
    let borderEdgeX = abs(abs(boardCoord.x) - 9.0) * gridSpacing;
    let borderEdgeY = abs(abs(boardCoord.y) - 9.0) * (gridSpacing * cellAspect);
    if (borderEdgeX < lineWidth * 1.8) {
      gridLine = max(gridLine, colDrawn);
    }
    if (borderEdgeY < lineWidth * 1.8) {
      gridLine = max(gridLine, rowDrawn);
    }

    // 9 Star Points (Hoshi) pop in at row and col intersections
    let nearestInter = round(boardCoord);
    let isHoshiX = nearestInter.x == 0.0 || abs(nearestInter.x) == 6.0;
    let isHoshiY = nearestInter.y == 0.0 || abs(nearestInter.y) == 6.0;
    if (isHoshiX && isHoshiY) {
      let hoshiCenter = nearestInter * cellScale + boardOffset;
      let distHoshi = length(worldPosition - hoshiCenter);
      let hoshiRadius = 0.011 * (gridSpacing / 0.28);
      let dotShape = 1.0 - smoothstep(hoshiRadius * 0.75, hoshiRadius * 1.15, distHoshi);
      let hoshiXNorm = (nearestInter.x + 9.0) / 18.0;
      let hoshiYNorm = (9.0 - nearestInter.y) / 18.0;
      let hRowProg = clamp((drawProgress - hoshiYNorm * staggerFraction) / strokeDuration, 0.0, 1.0);
      let hColProg = clamp((drawProgress - hoshiXNorm * staggerFraction) / strokeDuration, 0.0, 1.0);
      let hoshiVisible = smoothstep(0.0, 0.03, min(hRowProg - hoshiXNorm, hColProg - hoshiYNorm));
      hoshiDot = dotShape * hoshiVisible;
    }
  }
  let boardEngraving = clamp(gridLine + hoshiDot, 0.0, 1.0);

  // 3. Polished Granite / Marble Material with Natural Veining
  let graniteRoughness = clamp(params.surfaceParams.y, 0.0, 1.0);
  let marbleUv = worldPosition * 2.8;
  let veinNoise1 = sin(marbleUv.x * 1.8 + sin(marbleUv.y * 2.5) * 1.6 + cos(marbleUv.x * 0.9) * 0.7);
  let veinNoise2 = sin(marbleUv.y * 2.4 + sin(marbleUv.x * 2.1) * 1.5);
  let primaryVeins = smoothstep(0.76, 0.98, abs(veinNoise1));
  let microVeins = smoothstep(0.84, 0.99, abs(veinNoise2)) * 0.45;
  let marblePattern = clamp(primaryVeins + microVeins, 0.0, 1.0);

  let mineralTexture = (material.r - 0.5) * graniteRoughness + marblePattern * 0.22 * graniteRoughness;
  var stoneAlbedo = studioColor * (1.0 + mineralTexture);

  // Inlaid / carved line color
  let gridOpacity = clamp(params.gridParams.z, 0.0, 1.0);
  let engravedLineColor = mix(stoneAlbedo * 0.28, vec3f(0.85, 0.76, 0.55) * 0.5, 0.15);
  stoneAlbedo = mix(stoneAlbedo, engravedLineColor, boardEngraving * gridOpacity);

  // Modulate stone albedo with leaf shadow so swaying tree branches and fluttering leaves
  // cast distinct, organic physical shadows across the granite wall.
  let leafShadowStrength = params.timeParams.y;
  let leafShadow = mix(1.0 - leafShadowStrength * 0.75, 1.0, clamp(globalLightShaped, 0.0, 1.0));
  stoneAlbedo = stoneAlbedo * leafShadow;

  let albedo = stoneAlbedo;
  let direct = albedo * diffuse + vec3f(specular);

  let directExposure = max(params.surfaceParams.z, 0.0);
  let lightmapMix = clamp(params.surfaceParams.w, 0.0, 1.0);

  let globalBaseExposure = mix(
    params.shadowFloor,
    params.highlightExposure,
    globalLightShaped,
  );
  let effectiveExposure = mix(directExposure, globalBaseExposure * directExposure, lightmapMix);

  let globalDiffuse = mix(0.25, 1.0, lightFacing);
  let globalSurfaceResponse = material.r * globalDiffuse;
  let globalIllumination = vec3f(
    globalLightShaped * params.ambientLightStrength * globalSurfaceResponse * 0.3 * lightmapMix
  );
  let composed = (
    direct * effectiveExposure + globalIllumination
  ) * prismShadow * prismAo;
  return WallSample(
    albedo,
    largeNormal,
    microNormal,
    normal,
    material.a,
    globalLightShaped,
    glassGrounding.x,
    glassGrounding.y,
    composed,
  );
}
