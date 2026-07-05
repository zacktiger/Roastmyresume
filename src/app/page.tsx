'use client';

import React, { useRef, useState } from 'react';
import resumeData from '@/data/resume.json';
import CommitTicker from '@/components/CommitTicker';
import CommandPalette from '@/components/CommandPalette';
import BentoGrid from '@/components/BentoGrid';
import ChatInterface from '@/components/ChatInterface';
import ResumeUploader from '@/components/ResumeUploader';
import ResumeSandbox from '@/components/ResumeSandbox';
import { Mail, MapPin, Sparkles, Code, Cpu, Flame, Edit3 } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/BrandIcons';
import styles from './page.module.css';

export default function Home() {
  const [mode, setMode] = useState<'portfolio' | 'custom-roast' | 'sandbox'>('portfolio');
  // A ref to trigger prompts in the ChatInterface component from the CommandPalette
  const quickAskRef = useRef<((prompt: string) => void) | null>(null);

  const handleSelectProject = (id: string) => {
    const element = document.getElementById(`project-${id}`);
    if (element) {
      // Scroll to the card
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Trigger card click to open details modal
      setTimeout(() => {
        element.click();
      }, 500);
    }
  };

  const handleQuickAsk = (prompt: string) => {
    if (quickAskRef.current) {
      quickAskRef.current(prompt);
      // Scroll to chat section
      const chatSection = document.getElementById('chat-section');
      if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <main className={styles.main}>
      {/* 1. Infinite Commit Ticker */}
      <CommitTicker />

      {/* 2. Page Navigation / Command Palette bar */}
      <header className={styles.header}>
        <div className={styles.headerLimit}>
          <div className={styles.logoGroup}>
            <div className={styles.logoDot} />
            <h1 className={styles.logoText}>Ask My Resume</h1>
          </div>
          <CommandPalette 
            onSelectProject={handleSelectProject} 
            onQuickAsk={handleQuickAsk}
            resumeData={resumeData}
          />
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <span className={styles.introBadge}>
          <Sparkles size={12} style={{ marginRight: '6px' }} />
          {"Interact with Kshitij's Background"}
        </span>
        <h2 className={styles.heroTitle}>
          {"Don't just skim a PDF."} <br />
          <span className={styles.gradientText}>Roast and query my career history.</span>
        </h2>
        <p className={styles.heroSubtitle}>
          An AI-grounded portfolio built with Next.js, Framer Motion, and Gemini. Use the interactive agent to test qualifications or click builds to inspect key technical metrics.
        </p>
      </section>

      {/* Mode Switcher */}
      <div className={styles.modeToggleContainer}>
        <button 
          className={`${styles.modeButton} ${mode === 'portfolio' ? styles.activeModeButton : ''}`}
          onClick={() => setMode('portfolio')}
        >
          <Sparkles size={14} style={{ marginRight: '6px' }} />
          <span>{"Kshitij's AI Portfolio"}</span>
        </button>
        <button 
          className={`${styles.modeButton} ${mode === 'custom-roast' ? styles.activeModeButton : ''}`}
          onClick={() => setMode('custom-roast')}
        >
          <Flame size={14} style={{ marginRight: '6px', color: '#f43f5e' }} />
          <span>Roast Your Own</span>
        </button>
        <button 
          className={`${styles.modeButton} ${mode === 'sandbox' ? styles.activeModeButton : ''}`}
          onClick={() => setMode('sandbox')}
        >
          <Edit3 size={14} style={{ marginRight: '6px', color: '#6366f1' }} />
          <span>Roast Sandbox</span>
        </button>
      </div>

      {/* 4. Conditional Content Rendering */}
      {mode === 'portfolio' && (
        <div className={styles.layoutContainer}>
          {/* Left Column: Bento Grid of Projects & Quick Profile Specs */}
          <div className={styles.leftColumn}>
            {/* Profile Spec Card */}
            <div className={`${styles.profileCard} glass-panel`}>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar}>
                  <span>{resumeData.personal.name[0]}</span>
                </div>
                <div>
                  <h3 className={styles.profileName}>{resumeData.personal.name}</h3>
                  <p className={styles.profileTitle}>{resumeData.personal.title}</p>
                  <div className={styles.profileLocation}>
                    <MapPin size={12} />
                    <span>{resumeData.personal.location}</span>
                  </div>
                </div>
              </div>

              <p className={styles.profileAbout}>{resumeData.personal.about}</p>

              <div className={styles.socialLinks}>
                <a href={resumeData.personal.github} target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="GitHub">
                  <GithubIcon size={18} />
                </a>
                <a href={resumeData.personal.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="LinkedIn">
                  <LinkedinIcon size={18} />
                </a>
                <a href={`mailto:${resumeData.personal.email}`} className={styles.socialLink} title="Email">
                  <Mail size={18} />
                </a>
              </div>
            </div>

            {/* Dynamic Bento Grid of Projects */}
            <BentoGrid projects={resumeData.projects} className={styles.bentoGridOverride} />

            {/* Quick Skills Board */}
            <div className={styles.skillsContainer}>
              <div className={`${styles.skillsCard} glass-panel`}>
                <div className={styles.skillsHeader}>
                  <Code size={18} className={styles.skillsIcon} />
                  <h3>Languages</h3>
                </div>
                <div className={styles.skillsList}>
                  {resumeData.skills.languages.map((lang, idx) => (
                    <span key={idx} className={styles.skillBadge}>{lang}</span>
                  ))}
                </div>
              </div>

              <div className={`${styles.skillsCard} glass-panel`}>
                <div className={styles.skillsHeader}>
                  <Cpu size={18} className={styles.skillsIcon} style={{ color: '#a855f7' }} />
                  <h3>Frameworks</h3>
                </div>
                <div className={styles.skillsList}>
                  {resumeData.skills.frameworks.map((framework, idx) => (
                    <span key={idx} className={styles.skillBadge} style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}>{framework}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Chat Interface */}
          <div id="chat-section" className={styles.rightColumn}>
            <div className={styles.stickyChat}>
              <ChatInterface onQuickAskRef={quickAskRef} />
            </div>
          </div>
        </div>
      )}

      {mode === 'custom-roast' && (
        <div className={styles.customRoastContainer}>
          <ResumeUploader />
        </div>
      )}

      {mode === 'sandbox' && (
        <div className={styles.customRoastContainer}>
          <ResumeSandbox />
        </div>
      )}

      <footer className={styles.pageFooter}>
        <div className={styles.footerLimit}>
          <p>© 2026 Kshitij. Built with extreme restraint and reliable guardrails.</p>
        </div>
      </footer>
    </main>
  );
}
