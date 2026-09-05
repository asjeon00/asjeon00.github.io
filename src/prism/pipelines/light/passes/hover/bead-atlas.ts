import type { Gpu } from "vgpu";
import type { Texture } from "vgpu/core";
import { sampler } from "vgpu";

const BEAD_IMAGE_URLS = [
  "/projects/blsclone/blsclone.png",       // 0: blsclone (1/24/26)
  "/projects/yukon/yukon.png",             // 1: yukon (2/22/2026)
  "/projects/halfpastnoon/thumbnail.png",  // 2: halfpast*noon (2/24/26)
  "/projects/kodak/kodak.png",             // 3: kodak (3/28/2026)
  "/projects/newjeans/newjeans.png",       // 4: newjeans (4/27/2026)
  "/projects/bside/image.png",             // 5: bside (6/16/2026)
  "/projects/Aedena/thumbnail.png",        // 6: Aedena (6/27/2026)
  "/projects/pawchart/thumbnail.png",      // 7: pawchart (7/2/2026)
] as const;

const TILE_SIZE = 512;
const ATLAS_WIDTH = TILE_SIZE * 8;
const ATLAS_HEIGHT = TILE_SIZE;

export interface BeadAtlas {
  readonly texture: Texture;
  readonly sampler: GPUSampler;
  destroy(): void;
}

/**
 * Creates and loads the 8-tile texture atlas for the glass beads.
 */
export async function createBeadAtlas(gpu: Gpu): Promise<BeadAtlas> {
  const texture = gpu.device.createTexture({
    size: [ATLAS_WIDTH, ATLAS_HEIGHT],
    format: "rgba8unorm",
    usage: ["texture_binding", "copy_dst"],
    label: "prism.light.bead-atlas",
  });

  const beadSampler = sampler(gpu, {
    minFilter: "linear",
    magFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });

  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_WIDTH;
  canvas.height = ATLAS_HEIGHT;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to create 2D canvas context for bead atlas.");
  }

  // Draw rich editorial placeholder patterns while assets load
  const placeholders = [
    ["#1c202a", "#3b485d"],
    ["#231b1d", "#5c3d44"],
    ["#172422", "#355953"],
    ["#28201a", "#634d3b"],
    ["#1f1c2b", "#493e68"],
    ["#2d2218", "#59402e"],
    ["#19232a", "#374f5e"],
    ["#261928", "#543358"],
  ];
  for (let i = 0; i < 8; i++) {
    const grad = ctx.createRadialGradient(
      i * TILE_SIZE + TILE_SIZE * 0.5,
      TILE_SIZE * 0.5,
      10,
      i * TILE_SIZE + TILE_SIZE * 0.5,
      TILE_SIZE * 0.5,
      TILE_SIZE * 0.5
    );
    grad.addColorStop(0, placeholders[i]![1]!);
    grad.addColorStop(1, placeholders[i]![0]!);
    ctx.fillStyle = grad;
    ctx.fillRect(i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
  }

  function uploadCanvas(): void {
    const imageData = ctx!.getImageData(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);
    gpu.gpu.queue.writeTexture(
      { texture: texture.gpu },
      imageData.data,
      { bytesPerRow: ATLAS_WIDTH * 4, rowsPerImage: ATLAS_HEIGHT },
      [ATLAS_WIDTH, ATLAS_HEIGHT]
    );
  }

  // Upload initial fallback
  uploadCanvas();

  // Asynchronously load the 5 curated images
  void Promise.all(
    BEAD_IMAGE_URLS.map((url, i) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const tileX = i * TILE_SIZE;
          const imgAspect = img.width / Math.max(1, img.height);
          let sx = 0;
          let sy = 0;
          let sw = img.width;
          let sh = img.height;

          // Center-crop cover mapping
          if (imgAspect > 1) {
            sw = img.height;
            sx = (img.width - sw) * 0.5;
          } else {
            sh = img.width;
            sy = (img.height - sh) * 0.5;
          }

          ctx.drawImage(img, sx, sy, sw, sh, tileX, 0, TILE_SIZE, TILE_SIZE);
          uploadCanvas();
          resolve();
        };
        img.onerror = () => {
          console.warn(`[BeadAtlas] Failed to load image at ${url}`);
          resolve();
        };
        img.src = url;
      });
    })
  ).then(() => {
    uploadCanvas();
  });

  return {
    texture,
    sampler: beadSampler,
    destroy() {
      texture.destroy();
    },
  };
}
