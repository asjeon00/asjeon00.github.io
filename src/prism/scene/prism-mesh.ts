import type { Geometry, Gpu } from "vgpu";
import { geometry } from "vgpu";

import {
  GLASS_ORB_HEIGHT,
  GLASS_ORB_RADIUS,
  GO_CELL_ASPECT,
  GO_GRID_SPACING,
  PRISM_BACK_Z,
  PRISM_FRONT_Z,
  PRISM_TRIANGLE,
  type Triangle,
} from "../types";

export interface PrismMeshData {
  /** Interleaved position (xyz) then normal (xyz), 6 floats per vertex. */
  readonly vertices: Float32Array<ArrayBuffer>;
  readonly indices: Uint16Array<ArrayBuffer>;
}

/** Bytes between two vertices of `PrismMeshData.vertices`. */
export const PRISM_VERTEX_STRIDE = 24;
export const ORB_RINGS = 32;
export const ORB_SEGMENTS = 48;

/** Appends a smooth glass orb / biconvex Go stone to vertex and index buffers. */
function appendGlassOrb(
  cx: number,
  cy: number,
  radius: number,
  heightScale: number,
  backZ: number,
  vertices: number[],
  indices: number[]
): void {
  const baseVertex = vertices.length / 6;
  const cz = backZ + radius * heightScale;
  const segCols = ORB_SEGMENTS + 1;

  // Generate vertices from top pole (phi = 0) to equator (phi = pi/2) to bottom base (phi = pi)
  for (let r = 0; r <= ORB_RINGS; r++) {
    const phi = (r / ORB_RINGS) * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const currentRadius = radius * sinPhi;
    const z = Math.max(backZ, cz + radius * heightScale * cosPhi);

    // Smooth outward surface normal
    const nr = heightScale * sinPhi;
    const nz = cosPhi;
    const nLen = Math.hypot(nr, nz);
    const normR = nr / Math.max(nLen, 1e-5);
    const normZ = nz / Math.max(nLen, 1e-5);

    for (let s = 0; s <= ORB_SEGMENTS; s++) {
      const theta = (s / ORB_SEGMENTS) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const x = cx + currentRadius * cosT;
      const y = cy + currentRadius * sinT;
      const nx = normR * cosT;
      const ny = normR * sinT;

      vertices.push(x, y, z, nx, ny, normZ);
    }
  }

  // Generate CCW triangle indices
  for (let r = 0; r < ORB_RINGS; r++) {
    for (let s = 0; s < ORB_SEGMENTS; s++) {
      const a = baseVertex + r * segCols + s;
      const b = baseVertex + (r + 1) * segCols + s;
      const c = baseVertex + (r + 1) * segCols + (s + 1);
      const d = baseVertex + r * segCols + (s + 1);

      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }
}

/**
 * Vertices and indices for the glass orb / Baduk Go stones.
 * Generates the central refracting orb at (0, 0) plus companion Go stones at adjacent grid intersections.
 */
export function prismMeshData(
  _triangle: Triangle = PRISM_TRIANGLE,
  backZ = PRISM_BACK_Z,
  _frontZ = PRISM_FRONT_Z,
  radius = GLASS_ORB_RADIUS
): PrismMeshData {
  const vertices: number[] = [];
  const indices: number[] = [];
  const heightScale = GLASS_ORB_HEIGHT / Math.max(GLASS_ORB_RADIUS, 0.05);

  // 1. Primary Central Glass Orb at Tengen (0, 0)
  appendGlassOrb(0, 0, radius, heightScale, backZ, vertices, indices);

  // 2. Companion Glass Go Stones in 5-in-a-row (Gomoku) opening formation around Tengen (0, 0)
  const dx = GO_GRID_SPACING;
  const dy = GO_GRID_SPACING * GO_CELL_ASPECT;
  const companionPositions: readonly [number, number][] = [
    [dx, 0],   // (1, 0) - adjacent right
    [-dx, 0],  // (-1, 0) - adjacent left (forming 3-in-a-row with Tengen)
    [0, dy],   // (0, 1) - adjacent up
    [dx, dy],  // (1, 1) - adjacent up-right (diagonal to Tengen, adjacent to (1, 0) and (0, 1))
  ];

  for (const [cx, cy] of companionPositions) {
    appendGlassOrb(cx, cy, radius, heightScale, backZ, vertices, indices);
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
}

/** Unique line-list edges for visualising the generated topology. */
export function prismWireframeIndices(
  triangleIndices: Uint16Array<ArrayBuffer>
): Uint16Array<ArrayBuffer> {
  const seen = new Set<number>();
  const edges: number[] = [];
  for (let triangle = 0; triangle < triangleIndices.length; triangle += 3) {
    append(triangleIndices[triangle]!, triangleIndices[triangle + 1]!);
    append(triangleIndices[triangle + 1]!, triangleIndices[triangle + 2]!);
    append(triangleIndices[triangle + 2]!, triangleIndices[triangle]!);
  }
  return new Uint16Array(edges);

  function append(a: number, b: number): void {
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    const key = start * 65_536 + end;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(start, end);
  }
}

/**
 * Five bounding planes for the droplet solid:
 * 3 equilateral tangential planes bounding the circular perimeter + top cap + base plane.
 */
export function prismPlanes(
  _triangle: Triangle = PRISM_TRIANGLE,
  backZ = PRISM_BACK_Z,
  frontZ = PRISM_FRONT_Z
): readonly (readonly [number, number, number, number])[] {
  const r = GLASS_ORB_RADIUS;
  return [
    [0.866025, 0.5, 0, r] as const,
    [-0.866025, 0.5, 0, r] as const,
    [0, -1, 0, r] as const,
    [0, 0, 1, frontZ] as const,
    [0, 0, -1, -backZ] as const,
  ];
}

/** Uploads the solid droplet mesh. The caller owns it and must `destroy()` it. */
export function prismGeometry(gpu: Gpu, label: string): Geometry {
  const { vertices, indices } = prismMeshData();
  return upload(gpu, label, vertices, indices);
}

/** Uploads the same mesh as unique triangle edges for a line-list overlay. */
export function prismWireframeGeometry(gpu: Gpu, label: string): Geometry {
  const { vertices, indices } = prismMeshData();
  return upload(gpu, label, vertices, prismWireframeIndices(indices), true);
}

function upload(
  gpu: Gpu,
  label: string,
  vertices: Float32Array<ArrayBuffer>,
  indices: Uint16Array<ArrayBuffer>,
  wireframe = false
): Geometry {
  return geometry(gpu, {
    label,
    ...(wireframe ? { topology: "line-list" as const } : {}),
    buffers: [
      {
        data: vertices,
        stride: PRISM_VERTEX_STRIDE,
        attributes: { position: "float32x3", normal: "float32x3" },
      },
    ],
    indices,
  });
}
