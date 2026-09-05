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
  @location(0) uv: vec2f,
};

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
  var out: VertexOutput;

  let width = params.paperTransform.z * (1.0 + params.shadowParams.y);
  let height = params.paperTransform.w * (1.0 + params.shadowParams.y);

  // Offset shadow in direction opposite to light
  let offsetX = params.shadowParams.z;
  let offsetY = params.shadowParams.w;

  let localX = in.position.x * width;
  let localY = in.position.y * height;

  let worldX = params.paperTransform.x + localX + offsetX;
  let worldY = params.paperTransform.y + localY + offsetY;
  // Sits directly on the board plane (z = 0.002 to prevent z-fighting with the wall)
  let worldZ = 0.002;

  out.clipPosition = params.viewProjection * vec4f(worldX, worldY, worldZ, 1.0);
  out.uv = in.uv;
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  let uv = in.uv;
  let maxOpacity = params.shadowParams.x * params.paperState.w;

  if (maxOpacity <= 0.001) {
    discard;
  }

  // Smooth two-stage edge falloff for soft ambient contact occlusion
  let dx = min(uv.x, 1.0 - uv.x);
  let dy = min(uv.y, 1.0 - uv.y);
  let edgeDist = min(dx, dy);

  // Ambient occlusion core + soft diffused penumbra
  let penumbra = smoothstep(0.0, 0.16, edgeDist);
  let umbra = smoothstep(0.04, 0.22, edgeDist);
  let shadowProfile = mix(penumbra * 0.45, umbra, 0.65);

  let finalAlpha = shadowProfile * maxOpacity;
  // Deep warm neutral contact shadow color
  let shadowRgb = vec3f(0.03, 0.04, 0.06);

  return vec4f(shadowRgb * finalAlpha, finalAlpha);
}
