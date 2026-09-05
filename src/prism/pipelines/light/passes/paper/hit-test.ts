import { CAMERA_FOV_DEGREES, CAMERA_PITCH_DEGREES } from "../../../../types";

/**
 * Unprojects a DOM pointer coordinate (clientX, clientY) on the canvas to world coordinates (worldX, worldY)
 * on the Baduk board plane at Z = 0.
 */
export function unprojectCanvasToBoardPlane(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  cameraDistance = 5.15,
  pitchDegrees = CAMERA_PITCH_DEGREES,
  fovDegrees = CAMERA_FOV_DEGREES
): readonly [number, number] | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  // Normalized Device Coordinates in [-1, 1]
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = 1 - ((clientY - rect.top) / rect.height) * 2;

  const aspect = rect.width / rect.height;
  const tanHalfFov = Math.tan(((fovDegrees * Math.PI) / 180) / 2);
  const pitchRad = (pitchDegrees * Math.PI) / 180;

  // Camera world position (assuming yaw = 0 at rest)
  const cosPitch = Math.cos(pitchRad);
  const sinPitch = Math.sin(pitchRad);
  const camX = 0;
  const camY = sinPitch * cameraDistance;
  const camZ = cosPitch * cameraDistance;

  // Camera basis vectors
  // Forward points towards (0, 0, 0)
  const forwardX = -camX / cameraDistance;
  const forwardY = -camY / cameraDistance;
  const forwardZ = -camZ / cameraDistance;

  // Right is along world +X
  const rightX = 1;
  const rightY = 0;
  const rightZ = 0;

  // Up = cross(right, forward)
  const upX = 0;
  const upY = forwardZ * -1; // -(-cosPitch) = cosPitch
  const upZ = -forwardY;     // -(-sinPitch) = -sinPitch

  // Normalized ray direction from camera through (ndcX, ndcY)
  const dirX = forwardX + rightX * (ndcX * aspect * tanHalfFov) + upX * (ndcY * tanHalfFov);
  const dirY = forwardY + rightY * (ndcX * aspect * tanHalfFov) + upY * (ndcY * tanHalfFov);
  const dirZ = forwardZ + rightZ * (ndcX * aspect * tanHalfFov) + upZ * (ndcY * tanHalfFov);

  // Intersection with plane Z = 0: camZ + dirZ * t = 0 => t = -camZ / dirZ
  if (Math.abs(dirZ) < 1e-6) return null;
  const t = -camZ / dirZ;
  if (t <= 0) return null; // Behind camera

  const worldX = camX + dirX * t;
  const worldY = camY + dirY * t;

  return [worldX, worldY];
}
