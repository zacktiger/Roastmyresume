'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Terminal, 
  Flame, 
  Languages, 
  ExternalLink, 
  X,
  Code
} from 'lucide-react';
import styles from './BentoGrid.module.css';

interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bullets: string[];
  techStack: string[];
  link: string;
}

interface BentoGridProps {
  projects: Project[];
  className?: string;
}

export default function BentoGrid({ projects, className }: BentoGridProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Helper to get matching icons and gradient colors for each build
  const getProjectTheme = (id: string) => {
    switch (id) {
      case 'policast':
        return {
          icon: <Sparkles size={24} />,
          gradient: styles.indigoGradient,
          shadow: 'rgba(99, 102, 241, 0.15)',
          badgeColor: '#818cf8'
        };
      case 'url-shortener':
        return {
          icon: <Terminal size={24} />,
          gradient: styles.emeraldGradient,
          shadow: 'rgba(52, 211, 153, 0.15)',
          badgeColor: '#34d399'
        };
      case 'wildfire-cnn':
        return {
          icon: <Flame size={24} />,
          gradient: styles.roseGradient,
          shadow: 'rgba(248, 113, 113, 0.15)',
          badgeColor: '#f87171'
        };
      case 'sanskrit-ocr':
        return {
          icon: <Languages size={24} />,
          gradient: styles.orangeGradient,
          shadow: 'rgba(251, 146, 60, 0.15)',
          badgeColor: '#fb923c'
        };
      default:
        return {
          icon: <Code size={24} />,
          gradient: styles.indigoGradient,
          shadow: 'rgba(255, 255, 255, 0.1)',
          badgeColor: '#9aa5b1'
        };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className={`${styles.sectionContainer} ${className || ''}`}>
      <div className={styles.sectionHeader}>
        <span className={styles.badge}>Builds & Projects</span>
        <h2 className={styles.title}>The Bento Grid of Engineering</h2>
        <p className={styles.subtitle}>
          Interactive showcases of actual projects. Click any build to inspect its architecture, engineering highlights, and codebase notes.
        </p>
      </div>

      <motion.div 
        className={styles.grid}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
      >
        {projects.map((proj) => {
          const theme = getProjectTheme(proj.id);
          // Set custom layout classes for bento layout
          const layoutClass = proj.id === 'policast' || proj.id === 'sanskrit-ocr' 
            ? styles.span2 
            : styles.span1;

          return (
            <motion.div
              id={`project-${proj.id}`}
              key={proj.id}
              className={`${styles.card} ${layoutClass} ${theme.gradient}`}
              variants={itemVariants}
              whileHover={{ 
                y: -5,
                boxShadow: `0 12px 30px ${theme.shadow}`,
                borderColor: theme.badgeColor
              }}
              onClick={() => setSelectedProject(proj)}
              layoutId={`card-container-${proj.id}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper} style={{ color: theme.badgeColor }}>
                  {theme.icon}
                </div>
                <div className={styles.cardHeaderInfo}>
                  <h3 className={styles.projectName}>{proj.name}</h3>
                  <span className={styles.projectTagline}>{proj.tagline}</span>
                </div>
              </div>

              <p className={styles.projectDesc}>{proj.description}</p>

              <div className={styles.cardFooter}>
                <div className={styles.techList}>
                  {proj.techStack.slice(0, 3).map((tech, idx) => (
                    <span key={idx} className={styles.techTag}>
                      {tech}
                    </span>
                  ))}
                  {proj.techStack.length > 3 && (
                    <span className={styles.techTag}>+{proj.techStack.length - 3} more</span>
                  )}
                </div>
                <span className={styles.expandLabel}>Click to Inspect</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Expanded Modal Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <div className={styles.modalOverlay} onClick={() => setSelectedProject(null)}>
            <motion.div 
              className={styles.modalContent}
              layoutId={`card-container-${selectedProject.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className={styles.modalClose} 
                onClick={() => setSelectedProject(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className={styles.modalBody}>
                <div className={styles.modalHeader}>
                  <div 
                    className={styles.iconWrapper} 
                    style={{ color: getProjectTheme(selectedProject.id).badgeColor }}
                  >
                    {getProjectTheme(selectedProject.id).icon}
                  </div>
                  <div>
                    <h3 className={styles.modalTitle}>{selectedProject.name}</h3>
                    <span className={styles.modalTagline}>{selectedProject.tagline}</span>
                  </div>
                </div>

                <p className={styles.modalDesc}>{selectedProject.description}</p>

                <div className={styles.modalSection}>
                  <h4>Key Technical Highlights</h4>
                  <ul className={styles.bulletList}>
                    {selectedProject.bullets.map((bullet, idx) => (
                      <li key={idx}>
                        <span className={styles.bulletDot} style={{ background: getProjectTheme(selectedProject.id).badgeColor }} />
                        <span className={styles.bulletText}>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.modalSection}>
                  <h4>Stack & Core Utilities</h4>
                  <div className={styles.modalTechList}>
                    {selectedProject.techStack.map((tech, idx) => (
                      <span key={idx} className={styles.modalTechTag}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <a 
                    href={selectedProject.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.primaryLink}
                    style={{ background: getProjectTheme(selectedProject.id).badgeColor }}
                  >
                    <span>View Repository</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
