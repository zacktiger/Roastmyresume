'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { 
  Briefcase, 
  Terminal, 
  Flame, 
  Languages, 
  Smile, 
  Sparkles, 
  Mail, 
  Search
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './BrandIcons';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  onSelectProject: (id: string) => void;
  onQuickAsk: (prompt: string) => void;
  resumeData: any;
}

export default function CommandPalette({ 
  onSelectProject, 
  onQuickAsk, 
  resumeData 
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  // Toggle the menu when pressing ⌘K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleProjectSelect = (id: string) => {
    onSelectProject(id);
    setOpen(false);
  };

  const handleQuickAskSelect = (prompt: string) => {
    onQuickAsk(prompt);
    setOpen(false);
  };

  return (
    <>
      <button className={styles.triggerButton} onClick={() => setOpen(true)}>
        <Search size={14} />
        <span>Press</span>
        <kbd className={styles.kbd}>⌘K</kbd>
        <span>to search anything...</span>
      </button>

      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen} 
        label="Global command palette"
        className={styles.dialogOverlay}
      >
        <div className={styles.dialogContent}>
          <div className={styles.inputWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <Command.Input 
              placeholder="Search projects, skills, or ask a question..." 
              className={styles.input}
            />
            <button className={styles.closeButton} onClick={() => setOpen(false)}>ESC</button>
          </div>

          <Command.List className={styles.list}>
            <Command.Empty className={styles.empty}>No results found.</Command.Empty>

            <Command.Group heading="Builds & Projects" className={styles.group}>
              <Command.Item 
                onSelect={() => handleProjectSelect('policast')} 
                className={styles.item}
              >
                <Sparkles size={16} className={styles.itemIcon} style={{ color: '#818cf8' }} />
                <span className={styles.itemName}>PoliCast</span>
                <span className={styles.itemShortcut}>Project</span>
              </Command.Item>
              
              <Command.Item 
                onSelect={() => handleProjectSelect('url-shortener')} 
                className={styles.item}
              >
                <Terminal size={16} className={styles.itemIcon} style={{ color: '#34d399' }} />
                <span className={styles.itemName}>URL Shortener</span>
                <span className={styles.itemShortcut}>Project</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => handleProjectSelect('wildfire-cnn')} 
                className={styles.item}
              >
                <Flame size={16} className={styles.itemIcon} style={{ color: '#f87171' }} />
                <span className={styles.itemName}>Wildfire CNN</span>
                <span className={styles.itemShortcut}>Project</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => handleProjectSelect('sanskrit-ocr')} 
                className={styles.item}
              >
                <Languages size={16} className={styles.itemIcon} style={{ color: '#fb923c' }} />
                <span className={styles.itemName}>Sanskrit OCR</span>
                <span className={styles.itemShortcut}>Project</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Quick Chat Queries" className={styles.group}>
              <Command.Item 
                onSelect={() => handleQuickAskSelect('Roast my resume! Don\'t hold back, give me constructive criticism.')} 
                className={styles.item}
              >
                <Flame size={16} className={styles.itemIcon} style={{ color: '#f43f5e' }} />
                <span className={styles.itemName}>🔥 Roast my resume</span>
                <span className={styles.itemShortcut}>AI action</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => handleQuickAskSelect('Summarize Kshitij\'s technical stack.')} 
                className={styles.item}
              >
                <Briefcase size={16} className={styles.itemIcon} style={{ color: '#60a5fa' }} />
                <span className={styles.itemName}>What is Kshitij\'s tech stack?</span>
                <span className={styles.itemShortcut}>AI query</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => handleQuickAskSelect('Tell me about Kshitij\'s experience building with LLMs.')} 
                className={styles.item}
              >
                <Sparkles size={16} className={styles.itemIcon} style={{ color: '#c084fc' }} />
                <span className={styles.itemName}>How does Kshitij use AI/LLMs?</span>
                <span className={styles.itemShortcut}>AI query</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Links & Contacts" className={styles.group}>
              <Command.Item 
                onSelect={() => window.open(resumeData.personal.github, '_blank')} 
                className={styles.item}
              >
                <GithubIcon size={16} className={styles.itemIcon} />
                <span className={styles.itemName}>GitHub Profile</span>
                <span className={styles.itemShortcut}>External</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => window.open(resumeData.personal.linkedin, '_blank')} 
                className={styles.item}
              >
                <LinkedinIcon size={16} className={styles.itemIcon} />
                <span className={styles.itemName}>LinkedIn Profile</span>
                <span className={styles.itemShortcut}>External</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => window.open(`mailto:${resumeData.personal.email}`, '_blank')} 
                className={styles.item}
              >
                <Mail size={16} className={styles.itemIcon} />
                <span className={styles.itemName}>Email Kshitij</span>
                <span className={styles.itemShortcut}>External</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}
