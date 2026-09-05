struct PaperUniforms {
  viewProjection: mat4x4f,
  paperTransform: vec4f, // x: posX, y: posY, z: width, w: height
  paperState: vec4f,     // x: progress, y: waveCurl, z: elevation, w: opacity
  paperMaterial: vec4f,  // x: grain, y: fiberScale, z: roughness, w: translucency
  paperColor: vec4f,     // xyz: baseColor, w: warmth
  lightDir: vec4f,       // xyz: light direction, w: direct exposure
  shadowParams: vec4f,   // x: shadowOpacity, y: spread, z: offsetX, w: offsetY
};

@group(0) @binding(0) var<uniform> params: PaperUniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};

struct VertexOutput {
  @builtin(position) clipPosition: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let uv = in.uv;
  let progress = clamp(params.paperState.x, 0.0, 1.0);
  let waveCurl = params.paperState.y;
  let elevation = params.paperState.z;

  // Scale plane to sheet dimensions
  let width = params.paperTransform.z;
  let height = params.paperTransform.w;
  let localX = in.position.x * width;
  let localY = in.position.y * height;

  // Dynamic paper wave curl while sliding across the board
  // Leading edge (+X, high u) lifts smoothly into a gentle bow that flattens as progress reaches 1.0
  let motionPhase = (1.0 - progress);
  let waveLeading = sin(clamp(uv.x * 2.8, 0.0, 3.14159)) * waveCurl * motionPhase;
  let waveTransverse = sin(uv.y * 3.14159) * 0.012 * motionPhase;
  let dynamicZ = elevation + waveLeading + waveTransverse;

  let worldX = params.paperTransform.x + localX;
  let worldY = params.paperTransform.y + localY;
  let worldPos = vec3f(worldX, worldY, dynamicZ);

  // Normal tilt calculation based on wave slope
  let dZdx = cos(clamp(uv.x * 2.8, 0.0, 3.14159)) * (2.8 / width) * waveCurl * motionPhase;
  let dZdy = cos(uv.y * 3.14159) * (3.14159 / height) * 0.012 * motionPhase;
  let tangentX = vec3f(1.0, 0.0, dZdx);
  let tangentY = vec3f(0.0, 1.0, dZdy);
  let normal = normalize(cross(tangentX, tangentY));

  out.clipPosition = params.viewProjection * vec4f(worldPos, 1.0);
  out.worldPos = worldPos;
  out.normal = normal;
  out.uv = uv;
  return out;
}

// ---------------------------------------------------------------------------
// Procedural Paper Texture Mechanics (Ported from 031-cloth-simulation)
// ---------------------------------------------------------------------------

fn hash21(p: vec2f) -> f32 {
  var p3 = fract(p * vec2f(123.34, 456.21));
  p3 = p3 + dot(p3, p3 + 45.32);
  return fract(p3.x * p3.y);
}

fn noise2D(p: vec2f) -> f32 {
  let i = floor(p);
  var f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

fn getPaperHeight(uv: vec2f, scale: f32) -> f32 {
  let p = uv * scale;

  // 1. High-frequency paper tooth (pressed cotton / cellulose pulp)
  let tooth = noise2D(p * 2.5);

  // 2. Anisotropic cellulose fibers (cross-directional wood & kozo fibers)
  let fiberH = noise2D(vec2f(p.x * 0.35, p.y * 3.8));
  let fiberV = noise2D(vec2f(p.x * 3.8, p.y * 0.35));
  let fibers = (fiberH + fiberV) * 0.5;

  // 3. Organic pulp flecks
  let fleck = pow(noise2D(p * 5.2), 4.0) * 1.8;

  // 4. Subtle macro cloudiness (natural density variation across handmade sheet)
  let cloud = noise2D(p * 0.18) * 0.3;

  return tooth * 0.45 + fibers * 0.35 + fleck * 0.1 + cloud * 0.1;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  let uv = in.uv;
  let norm = normalize(in.normal);
  let opacity = params.paperState.w;

  if (opacity <= 0.001) {
    discard;
  }

  // Authentic Deckle Edge (subtle micro-feathering at the borders of the sheet)
  let edgeDistX = min(uv.x, 1.0 - uv.x);
  let edgeDistY = min(uv.y, 1.0 - uv.y);
  let edgeDist = min(edgeDistX, edgeDistY);
  let deckleNoise = noise2D(uv * 180.0) * 0.0015;
  let deckle = smoothstep(0.0005, 0.004 + deckleNoise, edgeDist);

  // Sample multi-layer paper pulp & fiber structure
  let fiberScale = max(params.paperMaterial.y, 10.0);
  let paperH = getPaperHeight(uv, fiberScale);

  // Finite-difference normal perturbation for tactile paper relief
  let eps = vec2f(1.0 / 512.0, 0.0);
  let hL = getPaperHeight(uv - eps.xy, fiberScale);
  let hR = getPaperHeight(uv + eps.xy, fiberScale);
  let hD = getPaperHeight(uv - eps.yx, fiberScale);
  let hU = getPaperHeight(uv + eps.yx, fiberScale);
  let roughness = params.paperMaterial.z;
  let bumpNormal = normalize(norm + vec3f((hL - hR) * roughness * 1.6, (hD - hU) * roughness * 1.6, 0.0));

  // Natural paper substrate tone with ivory / washi warmth
  var rawPaper = params.paperColor.xyz;
  let ivoryTint = vec3f(1.025, 1.0, 0.94);
  rawPaper = mix(rawPaper, rawPaper * ivoryTint, params.paperColor.w);

  // Modulate with surface pulp grain
  let grainStrength = params.paperMaterial.x;
  let grainMod = (paperH - 0.5) * grainStrength * 0.22;
  var baseColor = clamp(rawPaper + vec3f(grainMod), vec3f(0.0), vec3f(1.0));

  // Subtle traditional gold fleck / sumi framing border inset
  let borderUv = abs(uv - vec2f(0.5)) * 2.0;
  let isBorder = max(borderUv.x, borderUv.y);
  let frameLine = smoothstep(0.92, 0.925, isBorder) * (1.0 - smoothstep(0.935, 0.94, isBorder));
  let goldFleck = vec3f(0.85, 0.74, 0.45) * (0.8 + noise2D(uv * 90.0) * 0.4);
  baseColor = mix(baseColor, goldFleck, frameLine * 0.65);

  // -------------------------------------------------------------
  // Porous Matte Paper Lighting Model (Half-Lambert + SSS + Sheen)
  // -------------------------------------------------------------
  let lightDir = normalize(params.lightDir.xyz);
  let lightExposure = max(params.lightDir.w, 0.1);

  // 1. Half-Lambert wrap diffuse (porous scattering across fibers)
  let NdotL = dot(bumpNormal, lightDir);
  let wrapDiff = pow(clamp((NdotL + 0.35) / 1.35, 0.0, 1.0), 1.25);
  let offscLight = smoothstep(-1.8, 1.0, NdotL);
  let diffuse = mix(offscLight, wrapDiff, 0.55) * lightExposure;

  // 2. Subsurface Scattering (soft glow through thin translucent sheet)
  let backLight = max(dot(-norm, lightDir), 0.0);
  let translucency = params.paperMaterial.w;
  let sss = pow(backLight, 2.0) * translucency * 0.38 * lightExposure;
  let sssColor = vec3f(1.0, 0.96, 0.88) * sss;

  // 3. Dry paper micro-sheen (Oren-Nayar diffuse sheen on cellulose fibers)
  let viewDir = vec3f(0.0, 0.0, 1.0);
  let halfVec = normalize(lightDir + viewDir);
  let spec = pow(max(dot(bumpNormal, halfVec), 0.0), 14.0) * 0.075 * (1.0 - roughness * 0.4) * lightExposure;

  let finalRgb = baseColor * diffuse + sssColor + vec3f(spec);
  let finalAlpha = opacity * deckle;

  return vec4f(finalRgb * finalAlpha, finalAlpha);
}
