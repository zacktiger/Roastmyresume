// Single source of truth for how a bullet score maps to a color + verdict.
// Shared between the live sandbox and the read-only share view so the two
// can never drift apart.

export type ScoreKey = 'reject' | 'meh' | 'good' | 'elite';

export interface ScoreTheme {
  key: ScoreKey;
  color: string;
  label: string;
}

export function getScoreTheme(score: number): ScoreTheme {
  if (score < 40) return { key: 'reject', color: '#f43f5e', label: 'Recruiter Reject' };
  if (score < 70) return { key: 'meh', color: '#fb923c', label: 'Meh / Forgotten' };
  if (score < 85) return { key: 'good', color: '#38bdf8', label: 'Interview Worthy' };
  return { key: 'elite', color: '#34d399', label: 'Instant Hire!' };
}
