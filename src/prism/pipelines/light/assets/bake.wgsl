import { spectralSample } from "../../shared/spectral/spectral.wgsl";

@group(0) @binding(0) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var wallMask: texture_2d<f32>;
@group(0) @binding(2) var wallMaskSampler: sampler;

fn hash2(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn hash22(p: vec2f) -> vec2f {
  let q = vec2f(dot(p, vec2f(127.1, 311.7)), dot(p, vec2f(269.5, 183.3)));
  return fract(sin(q) * 43758.5453123);
}

fn valueNoise(point: vec2f) -> f32 {
  let cell = floor(point);
  let local = fract(point);
  let blend = local * local * (3.0 - 2.0 * local);
  let top = mix(hash2(cell), hash2(cell + vec2f(1.0, 0.0)), blend.x);
  let bottom = mix(
    hash2(cell + vec2f(0.0, 1.0)),
    hash2(cell + vec2f(1.0, 1.0)),
    blend.x,
  );
  return mix(top, bottom, blend.y);
}

fn fbm(point: vec2f, octaves: u32) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var frequency = 1.0;
  var weight = 0.0;
  for (var octave = 0u; octave < octaves; octave++) {
    value += valueNoise(point * frequency) * amplitude;
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2.07;
  }
  return value / weight;
}

// Worley / Voronoi cellular noise for granite mineral grains
fn voronoi(p: vec2f) -> vec3f {
  let cell = floor(p);
  let local = fract(p);
  var minDist = 8.0;
  var secondMin = 8.0;
  var cellId = vec2f(0.0);
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let neighbor = vec2f(f32(x), f32(y));
      let pt = hash22(cell + neighbor);
      let diff = neighbor + pt - local;
      let d = dot(diff, diff);
      if (d < minDist) {
        secondMin = minDist;
        minDist = d;
        cellId = pt;
      } else if (d < secondMin) {
        secondMin = d;
      }
    }
  }
  return vec3f(sqrt(minDist), sqrt(secondMin), hash2(cellId));
}

fn graniteHeight(uv: vec2f) -> f32 {
  // Smooth honed granite surface: very subtle mineral relief
  let v1 = voronoi(uv * 38.0);
  let edge1 = smoothstep(0.0, 0.12, v1.y - v1.x);
  let v2 = voronoi(uv * 110.0);
  let micro = fbm(uv * 220.0, 3u);
  return (v1.z * 0.4 + v2.z * 0.35 + micro * 0.25) * 0.4 + edge1 * 0.04;
}

fn graniteAlbedo(uv: vec2f) -> vec2f {
  let v1 = voronoi(uv * 38.0);
  let v2 = voronoi(uv * 110.0);
  let micro = fbm(uv * 160.0, 3u);
  // Dark biotite mica flecks
  let isMica = step(0.80, v2.z);
  // Translucent quartz crystals
  let isQuartz = step(0.72, v1.z);
  var albedo = mix(0.76, 0.90, v1.z);
  albedo = mix(albedo, 0.36, isMica * 0.65);
  albedo = mix(albedo, 0.98, isQuartz * 0.22);
  albedo += (micro - 0.5) * 0.06;

  // Roughness: honed stone satin sheen (quartz 0.18, feldspar 0.26)
  var roughness = 0.25 + (v1.z - 0.5) * 0.06;
  roughness = mix(roughness, 0.18, isQuartz * 0.35);
  return vec2f(albedo, roughness);
}

fn inBounds(pixel: vec2u) -> bool {
  return all(pixel < textureDimensions(outputTexture));
}

@compute @workgroup_size(8, 8)
fn wall_material(@builtin(global_invocation_id) id: vec3u) {
  if (!inBounds(id.xy)) { return; }
  let size = vec2f(textureDimensions(outputTexture));
  let uv = (vec2f(id.xy) + 0.5) / size;
  let epsilon = 1.0 / max(size.x, size.y);
  let heightX = graniteHeight(uv + vec2f(epsilon, 0.0))
    - graniteHeight(uv - vec2f(epsilon, 0.0));
  let heightY = graniteHeight(uv + vec2f(0.0, epsilon))
    - graniteHeight(uv - vec2f(0.0, epsilon));
  let albRough = graniteAlbedo(uv);
  // Honed granite normals (subtle micro-relief)
  textureStore(outputTexture, id.xy, vec4f(
    albRough.x,
    0.5 - heightX * 0.28,
    0.5 - heightY * 0.28,
    albRough.y,
  ));
}

// Droplet contact ambient occlusion and shadow
fn grounding(point: vec2f) -> vec2f {
  let r = length(point);
  let dropletRadius = 0.55;
  let d = r - dropletRadius;
  let baseContact = exp(-(d * d) / 0.0035);
  let edgeOcclusion = exp(-max(d, 0.0) / 0.05);
  let inside = select(1.0, 0.86, r < dropletRadius);
  return vec2f(
    clamp(1.0 - baseContact * 0.22, 0.0, 1.0),
    clamp(1.0 - edgeOcclusion * 0.20 - baseContact * 0.35, 0.0, 1.0) * inside,
  );
}

// Spline-style studio spotlight & gradient sweep
fn overheadLight(uv: vec2f) -> f32 {
  let lightCenter = vec2f(0.36, 0.52);
  let d = length((uv - lightCenter) * vec2f(1.0, 1.3));
  let spot = exp(-d * d * 2.6) * 0.88;
  let horiz = smoothstep(0.92, 0.12, uv.x) * 0.65;
  return clamp(spot + horiz, 0.06, 1.0);
}

fn storeWallLighting(pixel: vec2u, globalLight: f32) {
  let size = vec2f(textureDimensions(outputTexture));
  let uv = (vec2f(pixel) + 0.5) / size;
  let local = uv * 2.0 - 1.0;
  let contact = grounding(local);
  let edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  let edgeFade = smoothstep(0.0, 0.06, edgeDistance);
  textureStore(outputTexture, pixel, vec4f(globalLight * edgeFade, contact, 1.0));
}

@compute @workgroup_size(8, 8)
fn wall_lighting(@builtin(global_invocation_id) id: vec3u) {
  if (!inBounds(id.xy)) { return; }
  let uv = (vec2f(id.xy) + 0.5) / vec2f(textureDimensions(outputTexture));
  storeWallLighting(id.xy, textureSampleLevel(wallMask, wallMaskSampler, uv, 0.0).r);
}

@compute @workgroup_size(8, 8)
fn wall_lighting_fallback(@builtin(global_invocation_id) id: vec3u) {
  if (!inBounds(id.xy)) { return; }
  let uv = (vec2f(id.xy) + 0.5) / vec2f(textureDimensions(outputTexture));
  storeWallLighting(id.xy, overheadLight(uv));
}

fn beamColor(wavelength: f32) -> vec3f {
  let coordinate = clamp((wavelength - 400.0) / 300.0 * 127.0, 0.0, 127.0);
  let lower = min(u32(floor(coordinate)), 126u);
  return mix(spectralSample(lower).rgb, spectralSample(lower + 1u).rgb, fract(coordinate));
}

@compute @workgroup_size(8, 8)
fn caustic_profile(@builtin(global_invocation_id) id: vec3u) {
  if (!inBounds(id.xy)) { return; }
  let size = vec2f(textureDimensions(outputTexture));
  let travel = f32(id.x) / max(size.x - 1.0, 1.0);
  let wavelength = 700.0 - f32(id.y) / max(size.y - 1.0, 1.0) * 300.0;
  let coarse = fbm(vec2f(travel * 18.0, wavelength * 0.018), 4u);
  let filament = 0.5 + 0.5 * sin(travel * 104.0 + wavelength * 0.071);
  let focus = 0.72 + coarse * 0.24 + filament * 0.04;
  let tail = 1.0 - smoothstep(0.58, 1.08, travel) * 0.44;
  let farNeutral = smoothstep(0.2, 0.88, travel) * 0.36;
  let spectral = beamColor(wavelength);
  let hue = spectral / max(max(spectral.r, spectral.g), max(spectral.b, 1e-5));
  let rgb = clamp(mix(hue, vec3f(1.0), farNeutral) * focus * tail, vec3f(0.0), vec3f(1.0));
  textureStore(outputTexture, id.xy, vec4f(rgb, focus * tail));
}
