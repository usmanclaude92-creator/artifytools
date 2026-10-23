/** Pixel work for background removal (pure, unit-tested). */

export const MODEL_SIZE = 1024;

/** RGBA pixels (already resized to size×size) → planar float32 RGB in 0–1, as the model expects. */
export function toModelInput(rgba: Uint8ClampedArray, size = MODEL_SIZE): Float32Array {
  const n = size * size;
  const out = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    out[i] = rgba[i * 4]! / 255;
    out[n + i] = rgba[i * 4 + 1]! / 255;
    out[2 * n + i] = rgba[i * 4 + 2]! / 255;
  }
  return out;
}

/** Model output (0–1 alpha per pixel) → a greyscale RGBA mask image, alpha in every channel. */
export function alphaToMask(alpha: Float32Array, size = MODEL_SIZE): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = Math.round(Math.min(1, Math.max(0, alpha[i]!)) * 255);
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = out[i * 4 + 3] = v;
  }
  return out;
}

/** Puts the mask into the image's alpha channel, in place. `mask` is RGBA at the same size (alpha read from R). */
export function applyMask(image: Uint8ClampedArray, mask: Uint8ClampedArray): void {
  for (let i = 0; i < image.length; i += 4) image[i + 3] = Math.round((image[i + 3]! * mask[i]!) / 255);
}

/** Fraction of pixels kept (alpha > 50%): used to warn when nothing (or everything) was found. */
export function keptFraction(alpha: Float32Array): number {
  let kept = 0;
  for (let i = 0; i < alpha.length; i++) if (alpha[i]! > 0.5) kept++;
  return kept / alpha.length;
}
