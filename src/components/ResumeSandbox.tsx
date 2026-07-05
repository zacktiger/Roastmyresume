'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Edit3, RefreshCw, Send, CheckSquare, Award } from 'lucide-react';
import styles from './ResumeSandbox.module.css';

interface EvaluationResult {
  score: number;
  recruiterComment: string;
  improvements: string[];
}

const TEMPLATE_BULLETS = [
  {
    label: '🔴 Terrible (Generic)',
    text: 'Responsible for writing clean code and attending daily standup meetings with the engineering team.',
    description: 'Zero metrics, weak action words, lists generic duties.'
  },
  {
    label: '🟡 Average (Tech Soup)',
    text: 'Used React, HTML, CSS, JavaScript, Redux, Git, Webpack, and Jira to build website pages and fix bugs.',
    description: 'Lists many tools but has no business or technical metrics.'
  },
  {
    label: '🟢 Good (Project Spec)',
    text: 'Developed an AI podcast generator platform that converts policy documents into audio using Gemini API and TTS.',
    description: 'Action-oriented, describes project scope but lacks metrics.'
  },
  {
    label: '🔥 Elite (Kshitij\'s Bullet)',
    text: 'Implemented real-time features using Server-Sent Events (SSE) and WebSockets, reducing UI latency by 35%.',
    description: 'Perfect combination of active verbs, specific technology, and quantitative impact.'
  }
];

export default function ResumeSandbox() {
  const [inputText, setInputText] = useState(TEMPLATE_BULLETS[0].text);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTemplate = (text: string) => {
    setInputText(text);
    setResult(null);
    setError(null);
  };

  const handleEvaluate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/evaluate-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletText: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate bullet point.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      console.error('Error evaluating bullet:', err);
      setError(err instanceof Error ? err.message : 'Failed to communicate with evaluator.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to color code the score
  const getScoreTheme = (score: number) => {
    if (score < 40) return { color: '#f43f5e', text: 'Recruiter Reject', class: styles.reject };
    if (score < 70) return { color: '#fb923c', text: 'Meh / Forgotten', class: styles.meh };
    if (score < 85) return { color: '#38bdf8', text: 'Interview Worthy', class: styles.good };
    return { color: '#34d399', text: 'Instant Hire!', class: styles.elite };
  };

  const scoreTheme = result ? getScoreTheme(result.score) : { color: '#626f7a', text: 'Unevaluated', class: '' };

  // Calculate SVG circular progress properties
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = result ? circumference - (result.score / 100) * circumference : circumference;

  return (
    <div className={`${styles.sandboxContainer} glass-panel`}>
      <div className={styles.header}>
        <div className={styles.badgeWrapper}>
          <Edit3 size={14} />
          <span className={styles.badgeText}>Resume Gamification Sandbox</span>
        </div>
        <h3 className={styles.title}>The Bullet Roast & Editor</h3>
        <p className={styles.subtitle}>
          Select a template below or write your own resume bullet point, then submit it to watch the recruiter AI evaluate your impact score.
        </p>
      </div>

      {/* Template Selectors */}
      <div className={styles.templatesSection}>
        <h4 className={styles.sectionTitle}>Templates to Test:</h4>
        <div className={styles.templateList}>
          {TEMPLATE_BULLETS.map((t, idx) => (
            <button
              key={idx}
              className={`${styles.templateBtn} ${inputText === t.text ? styles.activeTemplate : ''}`}
              onClick={() => handleSelectTemplate(t.text)}
              disabled={loading}
              title={t.description}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sandboxBody}>
        {/* Left Area: Text editor */}
        <div className={styles.editorPane}>
          <div className={styles.textareaHeader}>
            <span>Resume Bullet Point Editor</span>
            <span className={styles.charCount}>{inputText.length} characters</span>
          </div>
          <textarea
            className={styles.textarea}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder="Type your resume bullet point here (e.g. 'Optimized database queries and index coverage in PostgreSQL, improving response time by 50%')..."
          />
          <div className={styles.editorActions}>
            <button 
              className={styles.resetBtn} 
              onClick={() => handleSelectTemplate('')}
              disabled={loading || !inputText}
            >
              <RefreshCw size={12} />
              <span>Clear</span>
            </button>
            <button 
              className={styles.submitBtn}
              onClick={handleEvaluate}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className={styles.spinner} />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit to Recruiter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Area: Score Display & Recruiter Review */}
        <div className={styles.resultsPane}>
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.emptyResults}
              >
                <Award size={48} className={styles.emptyIcon} />
                <p>Click <strong>Submit to Recruiter</strong> to grade this bullet point.</p>
              </motion.div>
            )}

            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.loadingResults}
              >
                <div className={styles.radarPing} />
                <span>Recruiter is reading your claims...</span>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.resultsContent}
              >
                {/* Score Gauge */}
                <div className={styles.gaugeContainer}>
                  <svg width="120" height="120" viewBox="0 0 120 120" className={styles.svgGauge}>
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="8"
                    />
                    {/* Colored score circle */}
                    <motion.circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={scoreTheme.color}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className={styles.gaugeOverlay}>
                    <span className={styles.gaugeScore}>{result.score}</span>
                    <span className={styles.gaugeLabel}>/100</span>
                  </div>
                </div>

                <div className={`${styles.scoreBanner} ${scoreTheme.class}`}>
                  <span>{scoreTheme.text}</span>
                </div>

                {/* Recruiter Critique */}
                <div className={styles.critiqueSection}>
                  <div className={styles.critiqueHeader}>
                    <Flame size={14} style={{ color: '#ff5f56' }} />
                    <h5>Recruiter Feedback</h5>
                  </div>
                  <p className={styles.critiqueText}>
                    {"\"" + result.recruiterComment + "\""}
                  </p>
                </div>

                {/* Actionable items */}
                {result.improvements.length > 0 && (
                  <div className={styles.improvementsSection}>
                    <h5>Suggested Fixes:</h5>
                    <ul className={styles.improvementsList}>
                      {result.improvements.map((improvement, idx) => (
                        <li key={idx}>
                          <CheckSquare size={13} className={styles.checkIcon} style={{ color: scoreTheme.color }} />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span>Error: {error}</span>
        </div>
      )}
    </div>
  );
}
