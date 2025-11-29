/**
 * Blog Content Formatter
 * Converts simple markdown-style syntax to formatted HTML
 */

import React from 'react';

export interface FormattedContent {
  type: 'heading' | 'paragraph';
  level?: number; // For headings: 2 or 3
  content: string;
}

export interface TextSegment {
  type: 'text' | 'link';
  content: string;
  url?: string;
}

/**
 * Parse links in text: [text](url)
 */
export function parseLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Add the link
    segments.push({
      type: 'link',
      content: match[1], // Link text
      url: match[2] // URL
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  // If no links found, return the whole text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: text
    });
  }

  return segments;
}

export function parseContent(content: string): FormattedContent[] {
  const lines = content.split('\n');
  const formatted: FormattedContent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue; // Skip empty lines

    // Check for headings
    if (trimmed.startsWith('### ')) {
      formatted.push({
        type: 'heading',
        level: 3,
        content: trimmed.substring(4).trim()
      });
    } else if (trimmed.startsWith('## ')) {
      formatted.push({
        type: 'heading',
        level: 2,
        content: trimmed.substring(3).trim()
      });
    } else {
      // Regular paragraph
      formatted.push({
        type: 'paragraph',
        content: trimmed
      });
    }
  }

  return formatted;
}

/**
 * Render text segments with links
 */
function renderTextWithLinks(text: string, key: string | number): JSX.Element {
  const segments = parseLinks(text);
  
  return React.createElement(
    React.Fragment,
    null,
    segments.map((segment, idx) => {
      if (segment.type === 'link') {
        const isInternal = segment.url?.startsWith('/');
        
        return React.createElement(
          'a',
          {
            key: `${key}-${idx}`,
            href: segment.url,
            target: isInternal ? '_self' : '_blank',
            rel: isInternal ? undefined : 'noopener noreferrer',
            className: 'text-primary hover:text-primary/80 underline font-medium transition-colors'
          },
          segment.content
        );
      }
      return React.createElement('span', { key: `${key}-${idx}` }, segment.content);
    })
  );
}

export function formatContentForDisplay(content: string): JSX.Element[] {
  const parsed = parseContent(content);
  
  return parsed.map((item, index) => {
    if (item.type === 'heading') {
      if (item.level === 2) {
        return React.createElement(
          'h2',
          { key: index, className: 'text-2xl font-bold text-gray-900 mt-8 mb-4' },
          renderTextWithLinks(item.content, `h2-${index}`)
        );
      } else if (item.level === 3) {
        return React.createElement(
          'h3',
          { key: index, className: 'text-xl font-semibold text-gray-900 mt-6 mb-3' },
          renderTextWithLinks(item.content, `h3-${index}`)
        );
      }
    }
    
    return React.createElement(
      'p',
      { key: index, className: 'mb-4 text-gray-700 leading-relaxed' },
      renderTextWithLinks(item.content, `p-${index}`)
    );
  });
}
