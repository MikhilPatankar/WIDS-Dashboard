
import React, { ReactNode, JSXElementConstructor, ReactElement, ReactPortal } from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderMarkdown = () => {
    // Split by lines to somewhat preserve paragraph structure
    const lines = content.split('\n');
    let keyCounter = 0;

    return lines.map((line, lineIndex) => {
      if (line.trim() === '') {
        // Render empty lines that might be used for spacing between paragraphs
        return <br key={`br-${lineIndex}-${keyCounter++}`} />;
      }

      // Process line for inline markdown
      // Note: This is a simplified parser. For complex or nested markdown, a proper library would be better.
      // Order of replacement matters to avoid conflicts (e.g., italics within bold).
      
      let processedLine: (string | JSX.Element)[] = [line];

      // 1. Code blocks (simple ```text``` - no language highlighting for now)
      // This is hard to do with simple string splitting if content inside can have other markdown
      // Let's assume for now code blocks are single lines or handled by `whitespace-pre-wrap`

      // 2. Inline code: `code`
      processedLine = processedLine.flatMap((segment): (string | JSX.Element)[] => {
        if (typeof segment === 'string') {
          return segment.split(/\`(.*?)\`/g).map((part, i) =>
            i % 2 === 1
              ? <code key={`code-${lineIndex}-${keyCounter++}`} className="bg-tertiary-dark text-accent-purple px-1 py-0.5 rounded text-sm font-mono">{part}</code>
              : part
          );
        }
        return [segment]; // segment is already a JSX.Element
      });
      
      // 3. Bold: **text**
      processedLine = processedLine.flatMap((segment): (string | JSX.Element)[] => {
        if (typeof segment === 'string') {
          return segment.split(/\*\*(.*?)\*\*/g).map((part, i) =>
            i % 2 === 1
              ? <strong key={`strong-${lineIndex}-${keyCounter++}`}>{part}</strong>
              : part
          );
        }
        return [segment];
      });

      // 4. Italics: *text* or _text_
      // Process underscores first
      processedLine = processedLine.flatMap((segment): (string | JSX.Element)[] => {
        if (typeof segment === 'string') {
          return segment.split(/\_(.*?)\_/g).map((part, i) =>
            i % 2 === 1
              ? <em key={`em_u-${lineIndex}-${keyCounter++}`}>{part}</em>
              : part
          );
        }
        return [segment];
      });
      // Process asterisks (careful not to re-process parts of bold)
      processedLine = processedLine.flatMap((segment): (string | JSX.Element)[] => {
        if (typeof segment === 'string') {
          // Only process asterisks if not already part of a strong tag (simplification)
          return segment.split(/\*(.*?)\*/g).map((part, i) => {
            // This check is very basic and won't handle all edge cases of nested markdown.
            if (i % 2 === 1) {
              return <em key={`em_a-${lineIndex}-${keyCounter++}`}>{part}</em>;
            }
            return part;
          });
        }
        return [segment];
      });
      
      // Wrap each processed line in a div to ensure block display if needed, or rely on parent's pre-wrap
      // Using <p> or <div> per line can help with spacing if a line is a paragraph.
      return <div key={`line-${lineIndex}-${keyCounter++}`}>{processedLine}</div>;
    });
  };

  // The parent p tag with whitespace-pre-wrap will handle overall text flow and newlines between paragraphs
  return <>{renderMarkdown()}</>;
};

export default MarkdownRenderer;
