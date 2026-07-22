import type { Metadata } from 'next';
import Link from 'next/link';
import { Flame, CheckSquare } from 'lucide-react';
import { decodeRoast } from '@/lib/share';
import { getScoreTheme } from '@/lib/score';
import styles from './share.module.css';

interface SharePageProps {
  searchParams: Promise<{ s?: string }>;
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const { s } = await searchParams;
  const roast = decodeRoast(s);

  if (!roast) {
    return {
      title: 'Roast My Resume — Brutally Honest AI Resume Feedback',
      description: 'Grade a resume bullet point in seconds and see how a cynical AI recruiter reacts.',
    };
  }

  const theme = getScoreTheme(roast.score);
  const title = `${roast.score}/100 — ${theme.label} · Roast My Resume`;
  const description = roast.comment.length > 180 ? `${roast.comment.slice(0, 177)}…` : roast.comment;
  const ogImage = `/api/og?s=${encodeURIComponent(s ?? '')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

// Gauge geometry (matches the live sandbox dial).
const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default async function SharePage({ searchParams }: SharePageProps) {
  const { s } = await searchParams;
  const roast = decodeRoast(s);

  if (!roast) {
    return (
      <main className={styles.main}>
        <div className={`${styles.card} glass-panel`}>
          <h1 className={styles.fallbackTitle}>This roast link looks broken.</h1>
          <p className={styles.fallbackText}>
            The link may be incomplete or out of date — but yours can still get torched.
          </p>
          <Link href="/" className={styles.cta}>
            <Flame size={16} />
            <span>Roast my resume</span>
          </Link>
        </div>
      </main>
    );
  }

  const theme = getScoreTheme(roast.score);
  const strokeDashoffset = CIRCUMFERENCE - (roast.score / 100) * CIRCUMFERENCE;

  return (
    <main className={styles.main}>
      <div className={`${styles.card} glass-panel`}>
        <span className={styles.badge}>
          <Flame size={12} style={{ marginRight: '6px', color: '#f43f5e' }} />
          A recruiter graded this bullet
        </span>

        <div className={styles.gaugeContainer}>
          <svg width="120" height="120" viewBox="0 0 120 120" className={styles.svgGauge}>
            <circle cx="60" cy="60" r={RADIUS} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="transparent"
              stroke={theme.color}
              strokeWidth="8"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className={styles.gaugeOverlay}>
            <span className={styles.gaugeScore}>{roast.score}</span>
            <span className={styles.gaugeLabel}>/100</span>
          </div>
        </div>

        <div className={`${styles.scoreBanner} ${styles[theme.key]}`}>
          <span>{theme.label}</span>
        </div>

        <div className={styles.bulletBlock}>
          <h2 className={styles.blockLabel}>The Bullet</h2>
          <p className={styles.bulletText}>{roast.bullet}</p>
        </div>

        <div className={styles.critiqueSection}>
          <div className={styles.critiqueHeader}>
            <Flame size={14} style={{ color: '#ff5f56' }} />
            <h2 className={styles.blockLabel}>Recruiter Feedback</h2>
          </div>
          <p className={styles.critiqueText}>{`"${roast.comment}"`}</p>
        </div>

        {roast.improvements.length > 0 && (
          <div className={styles.improvementsSection}>
            <h2 className={styles.blockLabel}>Suggested Fixes</h2>
            <ul className={styles.improvementsList}>
              {roast.improvements.map((improvement, idx) => (
                <li key={idx}>
                  <CheckSquare size={13} className={styles.checkIcon} style={{ color: theme.color }} />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link href="/" className={styles.cta}>
          <Flame size={16} />
          <span>Roast your own bullet →</span>
        </Link>
      </div>
    </main>
  );
}
