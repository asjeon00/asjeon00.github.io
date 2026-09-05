import type { Geometry, Gpu } from "vgpu";
import { geometry } from "vgpu";

export const PAPER_SEGMENTS_X = 32;
export const PAPER_SEGMENTS_Y = 24;
export const PAPER_VERTEX_STRIDE = 32; // 3 floats pos + 3 floats normal + 2 floats uv = 8 floats = 32 bytes

export function createPaperGeometry(gpu: Gpu, label: string): Geometry {
  const cols = PAPER_SEGMENTS_X + 1;
  const rows = PAPER_SEGMENTS_Y + 1;
  const vertexCount = cols * rows;
  const vertices = new Float32Array(vertexCount * 8);

  let vIdx = 0;
  for (let r = 0; r < rows; r++) {
    const v = r / PAPER_SEGMENTS_Y;
    const y = v - 0.5; // [-0.5, 0.5]
    for (let c = 0; c < cols; c++) {
      const u = c / PAPER_SEGMENTS_X;
      const x = u - 0.5; // [-0.5, 0.5]
      const z = 0.0;

      // Position
      vertices[vIdx++] = x;
      vertices[vIdx++] = y;
      vertices[vIdx++] = z;

      // Normal (flat initially; perturbed dynamically in vertex/fragment shader)
      vertices[vIdx++] = 0.0;
      vertices[vIdx++] = 0.0;
      vertices[vIdx++] = 1.0;

      // UV
      vertices[vIdx++] = u;
      vertices[vIdx++] = v;
    }
  }

  const indexCount = PAPER_SEGMENTS_X * PAPER_SEGMENTS_Y * 6;
  const indices = new Uint16Array(indexCount);
  let iIdx = 0;

  for (let r = 0; r < PAPER_SEGMENTS_Y; r++) {
    for (let c = 0; c < PAPER_SEGMENTS_X; c++) {
      const i0 = r * cols + c;
      const i1 = i0 + 1;
      const i2 = (r + 1) * cols + c;
      const i3 = i2 + 1;

      // Two CCW triangles per quad
      indices[iIdx++] = i0;
      indices[iIdx++] = i1;
      indices[iIdx++] = i2;

      indices[iIdx++] = i1;
      indices[iIdx++] = i3;
      indices[iIdx++] = i2;
    }
  }

  return geometry(gpu, {
    label,
    buffers: [
      {
        data: vertices,
        stride: PAPER_VERTEX_STRIDE,
        attributes: {
          position: "float32x3",
          normal: "float32x3",
          uv: "float32x2",
        },
      },
    ],
    indices,
  });
}
