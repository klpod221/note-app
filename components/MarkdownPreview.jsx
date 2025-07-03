"use client";

import { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

// Configure marked
const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

const MarkdownPreview = forwardRef(
  ({ content, onScroll, onCheckboxToggle }, ref) => {
    const previewRef = useRef(null);

    // Expose the DOM node to parent component
    useImperativeHandle(ref, () => previewRef.current);

    // Memoize the HTML to avoid re-parsing when content hasn't changed
    const htmlContent = useMemo(() => {
      if (!content) return '';

      try {
        // Parse markdown to HTML
        const rawHtml = marked.parse(content);
        // Sanitize the HTML for security
        return DOMPurify.sanitize(rawHtml);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        return `<p>Error parsing markdown: ${error.message}</p>`;
      }
    }, [content]);

    // Handle checkbox clicks
    const handleCheckboxClick = (event) => {
      if (event.target.type === 'checkbox' && onCheckboxToggle) {
        event.preventDefault(); // Prevent default checkbox behavior

        // Find the line index by counting checkboxes before this one
        const checkboxes = previewRef.current.querySelectorAll('input[type="checkbox"]');
        const clickedIndex = Array.from(checkboxes).indexOf(event.target);

        if (clickedIndex !== -1) {
          onCheckboxToggle(clickedIndex);
        }
      }
    };

    return (
      <div
        className="markdown-body overflow-y-auto overflow-x-hidden h-full p-2 bg-white"
        ref={previewRef}
        onScroll={onScroll}
        onClick={handleCheckboxClick}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }
);

MarkdownPreview.displayName = 'MarkdownPreviewOptimized';

export default MarkdownPreview;
