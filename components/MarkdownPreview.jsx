"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Checkbox } from "antd";

const MarkdownPreview = forwardRef(
  ({ content, onScroll, onCheckboxToggle }, ref) => {
    const previewRef = useRef(null);

    // Expose the DOM node to parent component
    useImperativeHandle(ref, () => previewRef.current);

    return (
      <div
        className="markdown-body overflow-y-auto overflow-x-hidden h-full p-2 bg-white"
        ref={previewRef}
        onScroll={onScroll}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  showLineNumbers
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            li({ node, ...props }) {
              if (node.children[0]?.tagName) {
                const index = node.position.start.line - 1;
                const checked =
                  node.children[0].tagName === "input" &&
                  node.children[0].properties.checked;

                return (
                  <li {...props}>
                    <Checkbox
                      checked={checked}
                      className="mr-2"
                      onChange={() => onCheckboxToggle(index)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {node.children[1]?.value.trim()}
                    </Checkbox>
                  </li>
                );
              }

              return <li {...props} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);

export default MarkdownPreview;
