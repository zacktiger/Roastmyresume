'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Flame, RotateCcw, AlertTriangle } from 'lucide-react';
import styles from './ResumeUploader.module.css';
import { parseMarkdown } from '@/lib/markdown';

// Simple markdown formatter helper for roast output
function formatRoastContent(text: string): string {
  return parseMarkdown(text);
}

export default function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [roast, setRoast] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or plain text resume.');
      setFile(null);
      return;
    }
    if (selectedFile.size > 4 * 1024 * 1024) {
      setError('File size exceeds the 4MB limit.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const convertToBase64 = (fileObj: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const resetUploader = () => {
    setFile(null);
    setRoast('');
    setError(null);
    setProgress(0);
  };

  const startRoasting = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setRoast('');
    setProgress(10);

    try {
      const base64Data = await convertToBase64(file);
      setProgress(40);

      const response = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          fileType: file.type,
          fileName: file.name
        }),
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit resume for roasting.');
      }

      if (!response.body) {
        throw new Error('No streaming response received.');
      }

      setProgress(100);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedRoast = '';
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          
          // Save the last potentially incomplete line back to the buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr) {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    accumulatedRoast += parsed.text;
                    setRoast(accumulatedRoast);
                    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  } else if (parsed.error) {
                    accumulatedRoast += `\n*[Error: ${parsed.error}]*`;
                    setRoast(accumulatedRoast);
                  }
                } catch {
                  // Partial chunk, ignore parse errors
                }
              }
            }
          }
        }
      }

      // Process residual data left in buffer at completion
      if (buffer && buffer.startsWith('data: ')) {
        const dataStr = buffer.slice(6).trim();
        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulatedRoast += parsed.text;
              setRoast(accumulatedRoast);
              terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      console.error('Error roasting resume:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong during the roast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.uploaderContainer} glass-panel`}>
      <div className={styles.header}>
        <div className={styles.badgeWrapper}>
          <Flame size={14} className={styles.flameIcon} />
          <span className={styles.badgeText}>Recruiter Roast Engine v2.0</span>
        </div>
        <h3 className={styles.title}>Roast My Custom Resume</h3>
        <p className={styles.subtitle}>
          Upload your PDF or TXT resume to see how a cynical tech recruiter would tear it apart. No details saved, completely stateless.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!file && !roast && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerUpload}
          >
            <input
              ref={fileInputRef}
              type="file"
              className={styles.fileInput}
              accept=".pdf,.txt"
              onChange={handleChange}
            />
            <div className={styles.dropzoneContent}>
              <div className={styles.uploadIconWrapper}>
                <UploadCloud size={32} />
              </div>
              <p className={styles.dropzoneText}>
                <strong>Click to upload</strong> or drag and drop your resume
              </p>
              <span className={styles.fileTypes}>PDF or plain TXT (Max 4MB)</span>
            </div>
          </motion.div>
        )}

        {file && !roast && (
          <motion.div
            key="file-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={styles.fileCard}
          >
            <div className={styles.fileInfo}>
              <div className={styles.fileIconWrapper}>
                <FileText size={24} />
              </div>
              <div className={styles.fileMetadata}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingWrapper}>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                </div>
                <span className={styles.loadingText}>
                  {progress < 40 ? 'Reading file bytes...' : progress < 70 ? 'Connecting to Recruiter Copilot...' : 'Scanning for vulnerabilities...'}
                </span>
              </div>
            ) : (
              <div className={styles.actionButtons}>
                <button className={styles.cancelBtn} onClick={resetUploader}>
                  <RotateCcw size={14} />
                  <span>Choose Another</span>
                </button>
                <button className={styles.roastBtn} onClick={startRoasting}>
                  <Flame size={14} />
                  <span>Roast This Resume</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {roast && (
          <motion.div
            key="roast-terminal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.terminalContainer}
          >
            <div className={styles.terminalHeader}>
              <div className={styles.terminalDots}>
                <span className={`${styles.dot} ${styles.redDot}`} />
                <span className={`${styles.dot} ${styles.yellowDot}`} />
                <span className={`${styles.dot} ${styles.greenDot}`} />
              </div>
              <span className={styles.terminalTitle}>recruiter-roast-console ~/downloads/{file?.name}</span>
              <button className={styles.resetTerminalBtn} onClick={resetUploader} disabled={loading}>
                <RotateCcw size={12} style={{ marginRight: '4px' }} />
                <span>Upload New</span>
              </button>
            </div>

            <div className={styles.terminalBody}>
              <div 
                className={styles.roastMarkup} 
                dangerouslySetInnerHTML={{ __html: formatRoastContent(roast) }} 
              />
              {loading && (
                <div className={styles.terminalCursorWrapper}>
                  <span className={styles.promptArrow}>&gt;</span>
                  <span className={styles.terminalCursor} />
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className={styles.errorAlert}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
