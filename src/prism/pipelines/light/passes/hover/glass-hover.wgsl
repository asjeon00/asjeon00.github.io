import {
  Glass,
  dielectricFresnel,
} from "../../../shared/glass/glass-common.wgsl";

struct BeadHoverUniforms {
  bead0: vec4f,
  bead1: vec4f,
  bead2: vec4f,
  bead3: vec4f,
  bead4: vec4f,
  bead5: vec4f,
  bead6: vec4f,
  bead7: vec4f,
  config: vec4f,
  metrics: vec4f,
};

@group(0) @binding(0) var<uniform> params: Glass;
@group(0) @binding(1) var<uniform> hover: BeadHoverUniforms;
@group(0) @binding(2) var beadAtlas: texture_2d<f32>;
@group(0) @binding(3) var beadSampler: sampler;

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
};

@vertex
fn vs_main(@location(0) position: vec3f, @location(1) normal: vec3f) -> VertexOut {
  var out: VertexOut;
  out.position = params.viewProjection * vec4f(position, 1.0);
  out.worldPosition = position;
  out.worldNormal = normal;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4f {
  let dx = hover.metrics.x;
  let dy = hover.metrics.y;
  let beadRadius = hover.metrics.z;

  let centers = array<vec2f, 8>(
    vec2f(-dx, dy),        // 0: Top-Left (blsclone - 1/24/26)
    vec2f(0.0, dy),        // 1: Top-Center (yukon - 2/22/2026)
    vec2f(dx, dy),         // 2: Top-Right (halfpast*noon - 2/24/26)
    vec2f(-dx, 0.0),       // 3: Middle-Left (kodak - 3/28/2026)
    vec2f(0.0, 0.0),       // 4: Center (newjeans - 4/27/2026)
    vec2f(dx, 0.0),        // 5: Middle-Right (bside - 6/16/2026)
    vec2f(-dx, -dy),       // 6: Bottom-Left (Aedena - 6/27/2026)
    vec2f(0.0, -dy)        // 7: Bottom-Center (pawchart - 7/2/2026)
  );

  var closestIndex: i32 = -1;
  var closestDist: f32 = 1000.0;
  var localP: vec2f = vec2f(0.0);

  for (var i: i32 = 0; i < 8; i = i + 1) {
    let d = length(in.worldPosition.xy - centers[i]);
    if (d < beadRadius * 1.12 && d < closestDist) {
      closestDist = d;
      closestIndex = i;
      localP = (in.worldPosition.xy - centers[i]) / beadRadius;
    }
  }

  if (closestIndex < 0) {
    discard;
  }

  var beadState: vec4f;
  if (closestIndex == 0) { beadState = hover.bead0; }
  else if (closestIndex == 1) { beadState = hover.bead1; }
  else if (closestIndex == 2) { beadState = hover.bead2; }
  else if (closestIndex == 3) { beadState = hover.bead3; }
  else if (closestIndex == 4) { beadState = hover.bead4; }
  else if (closestIndex == 5) { beadState = hover.bead5; }
  else if (closestIndex == 6) { beadState = hover.bead6; }
  else { beadState = hover.bead7; }

  let pointerOffset = beadState.xy;
  let hoverProgress = beadState.z;
  let smooshScale = beadState.w;

  if (hoverProgress < 0.001) {
    discard;
  }

  let r = length(localP);
  let smooshPower = hover.config.z;

  // Organic circular smoosh aperture expanding into place
  let rAperture = mix(0.74, 1.0, clamp(smooshScale * smooshPower, 0.0, 1.0));
  let smooshMask = smoothstep(rAperture, rAperture - 0.07, r);
  if (smooshMask <= 0.0) {
    discard;
  }

  let fisheyeStrength = hover.config.x;
  let parallaxStrength = hover.config.y;

  // Fisheye spherical lens projection (hemispherical barrel curvature)
  let dir = select(vec2f(1.0, 0.0), localP / max(r, 0.0001), r > 0.0001);
  let theta = clamp(r * (1.5707963 * fisheyeStrength * 0.9), 0.0, 1.54);
  let warpedRadius = sin(theta);
  let warpedP = dir * warpedRadius;

  // Mouse-driven 3D perspective parallax
  let parallaxOffset = pointerOffset * (parallaxStrength * (1.0 - r * 0.25));
  let finalP = warpedP - parallaxOffset;

  // Normalized UV in square tile [0, 1]
  let tileU = clamp(finalP.x * 0.5 + 0.5, 0.005, 0.995);
  let tileV = clamp(0.5 - finalP.y * 0.5, 0.005, 0.995);

  // Map into 8-tile horizontal atlas
  let atlasU = (f32(closestIndex) + tileU) / 8.0;
  let atlasV = tileV;

  let imgColor = textureSampleLevel(beadAtlas, beadSampler, vec2f(atlasU, atlasV), 0.0).rgb;

  // Authentic optical glass integration & Fresnel attenuation
  let normal = normalize(in.worldNormal);
  let view = normalize(params.cameraPosition - in.worldPosition);
  let facing = clamp(dot(view, normal), 0.0, 1.0);
  let fresnel = dielectricFresnel(params.fresnelF0, facing);
  let transmission = 1.0 - fresnel * 0.65;

  let finalAlpha = hoverProgress * smooshMask * transmission;
  return vec4f(imgColor * finalAlpha, finalAlpha);
}
