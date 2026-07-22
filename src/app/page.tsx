'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ResumeUploader from '@/components/ResumeUploader';
import ResumeSandbox from '@/components/ResumeSandbox';
import { Flame, Edit3 } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/BrandIcons';
import styles from './page.module.css';

// TODO: swap these for the real profile URLs. Anything starting with http
// renders as an external link automatically.
const SOCIAL_LINKS = {
  github: '/',
  linkedin: '/',
};

function SocialLink({ href, title, children }: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith('http');

  if (isExternal) {
    return (
      <a
        href={href}
        title={title}
        className={styles.footerLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} title={title} className={styles.footerLink}>
      {children}
    </Link>
  );
}

export default function Home() {
  // The sandbox is the zero-friction front door; the full upload is the upgrade.
  const [mode, setMode] = useState<'sandbox' | 'full-roast'>('sandbox');

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerLimit}>
          <div className={styles.logoGroup}>
            <div className={styles.logoDot} />
            <h1 className={styles.logoText}>Roast My Resume</h1>
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <span className={styles.introBadge}>
          <Flame size={12} style={{ marginRight: '6px', color: '#f43f5e' }} />
          Powered by a deeply unimpressed recruiter
        </span>
        <h2 className={styles.heroTitle}>
          Your resume is fine. <br />
          <span className={styles.gradientText}>That&apos;s the problem.</span>
        </h2>
        <p className={styles.heroSubtitle}>
          Paste one bullet point and get graded in seconds, or upload the whole thing
          and watch a cynical tech recruiter take it apart line by line.
        </p>
      </section>

      <div className={styles.modeToggleContainer}>
        <button
          className={`${styles.modeButton} ${mode === 'sandbox' ? styles.activeModeButton : ''}`}
          onClick={() => setMode('sandbox')}
        >
          <Edit3 size={14} style={{ marginRight: '6px', color: '#6366f1' }} />
          <span>Grade One Bullet</span>
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'full-roast' ? styles.activeModeButton : ''}`}
          onClick={() => setMode('full-roast')}
        >
          <Flame size={14} style={{ marginRight: '6px', color: '#f43f5e' }} />
          <span>Roast My Whole Resume</span>
        </button>
      </div>

      <div className={styles.roastContainer}>
        {mode === 'sandbox' ? <ResumeSandbox /> : <ResumeUploader />}
      </div>

      <footer className={styles.pageFooter}>
        <div className={styles.footerLimit}>
          <p className={styles.footerCredit}>
            Built by <span className={styles.footerName}>Kshitij</span>
          </p>
          <div className={styles.footerLinks}>
            <SocialLink href={SOCIAL_LINKS.github} title="GitHub">
              <GithubIcon size={16} />
            </SocialLink>
            <SocialLink href={SOCIAL_LINKS.linkedin} title="LinkedIn">
              <LinkedinIcon size={16} />
            </SocialLink>
          </div>
          <p className={styles.footerNote}>
            Resumes are never stored on our servers. Files are sent to Google Gemini
            to generate the roast and are not retained after the response.
          </p>
        </div>
      </footer>
    </main>
  );
}
