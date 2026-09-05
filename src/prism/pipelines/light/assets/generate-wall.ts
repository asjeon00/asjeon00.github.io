import {
  clamp01,
  fbm,
  writePixel,
} from "./math";
import type { GeneratedLightAsset } from "./types";

function hash22(x: number, y: number): [number, number] {
  const dot1 = x * 127.1 + y * 311.7;
  const dot2 = x * 269.5 + y * 183.3;
  const s1 = Math.sin(dot1) * 43758.5453123;
  const s2 = Math.sin(dot2) * 43758.5453123;
  return [s1 - Math.floor(s1), s2 - Math.floor(s2)];
}

function voronoi(x: number, y: number): [number, number, number] {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  let minDist = 8.0;
  let secondMin = 8.0;
  let cellHash = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const [px, py] = hash22(ix + dx, iy + dy);
      const diffX = dx + px - fx;
      const diffY = dy + py - fy;
      const d = diffX * diffX + diffY * diffY;
      if (d < minDist) {
        secondMin = minDist;
        minDist = d;
        cellHash = px;
      } else if (d < secondMin) {
        secondMin = d;
      }
    }
  }
  return [Math.sqrt(minDist), Math.sqrt(secondMin), cellHash];
}

function graniteHeight(u: number, v: number): number {
  const v1 = voronoi(u * 38, v * 38);
  const edge1 = Math.max(0, Math.min(1, (v1[1] - v1[0]) / 0.12));
  const v2 = voronoi(u * 110, v * 110);
  const micro = fbm(u * 220, v * 220, 3);
  return (v1[2] * 0.4 + v2[2] * 0.35 + micro * 0.25) * 0.4 + edge1 * 0.04;
}

function graniteAlbedo(u: number, v: number): [number, number] {
  const v1 = voronoi(u * 38, v * 38);
  const v2 = voronoi(u * 110, v * 110);
  const micro = fbm(u * 160, v * 160, 3);
  const isMica = v2[2] > 0.80 ? 1 : 0;
  const isQuartz = v1[2] > 0.72 ? 1 : 0;

  let albedo = 0.76 + v1[2] * 0.14;
  albedo = albedo * (1 - isMica * 0.65) + 0.36 * isMica * 0.65;
  albedo = albedo * (1 - isQuartz * 0.22) + 0.98 * isQuartz * 0.22;
  albedo += (micro - 0.5) * 0.06;

  let roughness = 0.25 + (v1[2] - 0.5) * 0.06;
  roughness = roughness * (1 - isQuartz * 0.35) + 0.18 * isQuartz * 0.35;
  return [clamp01(albedo), clamp01(roughness)];
}

export function generateWallMaterial(
  size: readonly [number, number]
): GeneratedLightAsset {
  const [width, height] = size;
  const pixels = new Uint8Array(width * height * 4);
  const epsilon = 1 / Math.max(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const v = (y + 0.5) / height;
      const heightX =
        graniteHeight(u + epsilon, v) - graniteHeight(u - epsilon, v);
      const heightY =
        graniteHeight(u, v + epsilon) - graniteHeight(u, v - epsilon);
      const [albedo, roughness] = graniteAlbedo(u, v);
      writePixel(pixels, (y * width + x) * 4, [
        albedo,
        0.5 - heightX * 0.28,
        0.5 - heightY * 0.28,
        roughness,
      ]);
    }
  }
  return { width, height, pixels };
}

function overheadLight(u: number, v: number): number {
  const dx = (u - 0.36) * 1.0;
  const dy = (v - 0.52) * 1.3;
  const spot = Math.exp(-(dx * dx + dy * dy) * 2.6) * 0.88;
  const horiz = Math.max(0, Math.min(1, (0.92 - u) / 0.8)) * 0.65;
  return clamp01(spot + horiz);
}

function grounding(x: number, y: number): readonly [number, number] {
  const r = Math.hypot(x, y);
  const dropletRadius = 0.55;
  const d = r - dropletRadius;
  const baseContact = Math.exp(-(d * d) / 0.0035);
  const edgeOcclusion = Math.exp(-Math.max(d, 0) / 0.05);
  const inside = r < dropletRadius ? 0.86 : 1.0;
  const shadow = clamp01(1 - baseContact * 0.22);
  const ao = clamp01(1 - edgeOcclusion * 0.20 - baseContact * 0.35) * inside;
  return [shadow, ao];
}

export function generateWallLighting(
  size: readonly [number, number],
  globalLightMask?: (u: number, v: number) => number
): GeneratedLightAsset {
  const [width, height] = size;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const v = (y + 0.5) / height;
      const localX = u * 2 - 1;
      const localY = v * 2 - 1;
      const [shadow, ao] = grounding(localX, localY);
      const edgeDist = Math.min(u, 1 - u, v, 1 - v);
      const edgeFade = clamp01(edgeDist / 0.06);
      const global = globalLightMask
        ? globalLightMask(u, v)
        : overheadLight(u, v);
      writePixel(pixels, (y * width + x) * 4, [
        global * edgeFade,
        shadow,
        ao,
        1,
      ]);
    }
  }
  return { width, height, pixels };
}
