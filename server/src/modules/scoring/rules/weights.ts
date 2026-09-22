/** Deterministic scoring weights. These sum to 1.0 (100%) and must never be
 * changed without updating this comment and the product spec together.
 *   Resume:      20%
 *   GitHub:      25%
 *   Coding (CP): 20%
 *   Skill Match: 25%
 *   ATS:         10%
 */
export const SCORE_WEIGHTS = {
  resume: 0.2,
  github: 0.25,
  coding: 0.2,
  skillMatch: 0.25,
  ats: 0.1,
} as const;

const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(total - 1) > 1e-9) {
  throw new Error(`SCORE_WEIGHTS must sum to 1.0, got ${total}`);
}
