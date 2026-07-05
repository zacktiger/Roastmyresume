'use client';

import React, { useEffect, useState } from 'react';
import { GitCommit, ExternalLink } from 'lucide-react';
import styles from './CommitTicker.module.css';

interface CommitData {
  repo: string;
  message: string;
  sha: string;
  date: string;
  url: string;
}

export default function CommitTicker() {
  const [commit, setCommit] = useState<CommitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommit() {
      try {
        const res = await fetch('/api/github');
        if (res.ok) {
          const data = await res.json();
          setCommit(data);
        }
      } catch (e) {
        console.error('Error fetching github commit ticker:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCommit();
  }, []);

  if (loading) {
    return (
      <div className={styles.tickerWrapper}>
        <div className={styles.tickerContainer}>
          <div className={styles.tickerItem}>
            <GitCommit size={14} className={styles.iconSpinner} />
            <span>Fetching latest GitHub activity...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!commit) return null;

  const displayMessage = `Latest commit on ${commit.repo}: "${commit.message}" (${commit.sha}) — active & compiling.`;

  // We duplicate the items to create a seamless infinite marquee effect
  const tickerItems = Array(10).fill(displayMessage);

  return (
    <div className={styles.tickerWrapper}>
      <a 
        href={commit.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={styles.tickerContainer}
        title="View commit on GitHub"
      >
        <div className="animate-ticker">
          {tickerItems.map((text, idx) => (
            <div key={idx} className={styles.tickerItem}>
              <GitCommit size={14} className={styles.commitIcon} />
              <span>{text}</span>
              <ExternalLink size={10} className={styles.linkIcon} />
              <span className={styles.divider}>•</span>
            </div>
          ))}
        </div>
      </a>
    </div>
  );
}
