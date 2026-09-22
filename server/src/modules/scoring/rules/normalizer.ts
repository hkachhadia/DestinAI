/** Clamp a value into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Scales `value` linearly from [0, target] to [0, maxPoints], capping at
 * maxPoints once value reaches target. This is the core normalization
 * primitive used across resume/github/coding sub-scores — e.g.
 * `scaleToPoints(repos, 30, 25)` means "30 repos maxes out this 25-point
 * component, fewer repos earns proportionally fewer points." */
export function scaleToPoints(value: number, target: number, maxPoints: number): number {
  if (target <= 0) return 0;
  return clamp((value / target) * maxPoints, 0, maxPoints);
}

/** Rounds to the nearest integer and clamps to [0, 100] — the shape every
 * public-facing sub-score must be in. */
export function toScore100(value: number): number {
  return Math.round(clamp(value, 0, 100));
}
