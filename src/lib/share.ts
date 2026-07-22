// Roast results are shared by encoding the whole card into the URL — no
// server storage, so nothing is retained and the privacy promise holds.
// Because anyone can craft a link, `decodeRoast` treats its input as fully
// untrusted: it validates the shape and clamps every field before returning.

export interface SharedRoast {
  bullet: string;
  score: number;
  comment: string;
  improvements: string[];
}

// Compact wire shape (short keys keep the URL short).
interface Wire {
  b: string;
  s: number;
  c: string;
  i: string[];
}

const MAX_BULLET = 800;
const MAX_COMMENT = 1000;
const MAX_IMPROVEMENT = 400;
const MAX_IMPROVEMENTS = 6;

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeRoast(roast: SharedRoast): string {
  const wire: Wire = {
    b: roast.bullet,
    s: roast.score,
    c: roast.comment,
    i: roast.improvements,
  };
  return toBase64Url(JSON.stringify(wire));
}

function clampString(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

export function decodeRoast(encoded: string | undefined | null): SharedRoast | null {
  if (!encoded) return null;

  let wire: Partial<Wire>;
  try {
    wire = JSON.parse(fromBase64Url(encoded));
  } catch {
    return null;
  }

  if (!wire || typeof wire !== 'object') return null;

  const bullet = clampString(wire.b, MAX_BULLET).trim();
  const comment = clampString(wire.c, MAX_COMMENT).trim();

  // A shared card is meaningless without the bullet and the recruiter's take.
  if (!bullet || !comment) return null;

  let score = typeof wire.s === 'number' ? Math.round(wire.s) : 0;
  if (!Number.isFinite(score)) score = 0;
  score = Math.min(100, Math.max(0, score));

  const improvements = Array.isArray(wire.i)
    ? wire.i
        .slice(0, MAX_IMPROVEMENTS)
        .map((item) => clampString(item, MAX_IMPROVEMENT).trim())
        .filter(Boolean)
    : [];

  return { bullet, score, comment, improvements };
}
