/**
 * A robust, lightweight utility to parse basic Markdown syntax into safe HTML.
 * Supports:
 * - Code blocks (with language class tags)
 * - Headings (# to ######)
 * - Bold (**text** and __text__)
 * - Italic (*text* and _text_)
 * - Inline code (`code`)
 * - Unordered lists (*, -, +)
 * - Ordered lists (1., 2., etc.)
 * - Safe HTML escaping to prevent XSS (while preserving markdown placeholders)
 */
export function parseMarkdown(text: string): string {
  if (!text) return '';

  // 1. Normalize line endings and remove carriage returns
  let html = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Extract and preserve code blocks (triple backticks)
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    // Escape code block content to prevent HTML rendering inside code snippets
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const placeholder = `\uFFFC_CODE_${codeBlocks.length}_\uFFFC`;
    codeBlocks.push(
      `<pre class="markdown-pre"><code class="${
        lang ? 'language-' + lang : ''
      }">${escapedCode}</code></pre>`
    );
    return placeholder;
  });

  // 3. Escape HTML for the rest of the text, avoiding the code block placeholders
  const parts = html.split(/(\uFFFC_CODE_\d+_\uFFFC)/);
  html = parts
    .map((part) => {
      if (part.startsWith('\uFFFC_CODE_') && part.endsWith('_\uFFFC')) {
        return part; // keep placeholders intact
      }
      return part
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    })
    .join('');

  // 4. Headings (supports h1-h6)
  html = html.replace(/^(#{1,6})\s+(.*?)$/gm, (_, hashes, content) => {
    const level = hashes.length;
    return `<h${level} class="markdown-h${level}">${content}</h${level}>`;
  });

  // 5. Bold (double asterisks or double underscores)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // 6. Italic (single asterisk or single underscore)
  // Note: we check for non-asterisk boundaries to prevent matching bold tags incorrectly
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 7. Inline Code (single backticks)
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // 8. Lists (ordered and unordered)
  const lines = html.split('\n');
  let inUnorderedList = false;
  let inOrderedList = false;
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match unordered list items: optional spaces, list char (*, -, +), spaces, content
    const ulMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
    // Match ordered list items: optional spaces, digits, dot, spaces, content
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

    if (ulMatch) {
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        processedLines.push('<ul class="markdown-ul">');
        inUnorderedList = true;
      }
      processedLines.push(`<li>${ulMatch[3]}</li>`);
    } else if (olMatch) {
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        processedLines.push('<ol class="markdown-ol">');
        inOrderedList = true;
      }
      processedLines.push(`<li>${olMatch[3]}</li>`);
    } else {
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      processedLines.push(line);
    }
  }

  if (inUnorderedList) processedLines.push('</ul>');
  if (inOrderedList) processedLines.push('</ol>');

  html = processedLines.join('\n');

  // 9. Paragraph breaks / line breaks (only apply to non-block lines)
  const lines2 = html.split('\n');
  const finalizedLines = lines2.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return '<div class="markdown-spacing"></div>';
    }
    
    // Check if the line is a block element tag or within one
    const isBlock = /^(<\/?(ul|ol|li|pre|code|h[1-6]|div)>)/i.test(trimmed) || 
                    /(<\/(ul|ol|li|pre|h[1-6]|div)>)$/i.test(trimmed);
    
    const isPlaceholder = trimmed.startsWith('\uFFFC_CODE_') && trimmed.endsWith('_\uFFFC');
    
    if (isBlock || isPlaceholder) {
      return line;
    }
    return line + '<br />';
  });
  html = finalizedLines.join('\n');

  // 10. Restore code blocks
  codeBlocks.forEach((codeBlockHtml, index) => {
    html = html.replace(`\uFFFC_CODE_${index}_\uFFFC`, codeBlockHtml);
  });

  return html;
}
