/**
 * Deterministic hue (0–359) from a string, so every book without a real cover
 * always gets the same placeholder colour and the shelf looks varied but stable.
 */
export function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return ((h % 360) + 360) % 360;
}
