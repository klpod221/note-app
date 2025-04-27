"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import debounce from "lodash.debounce";
import MarkdownPreview from "@/components/MarkdownPreview";

import { Spin, Card, Popover, Tag, Button, List } from "antd";
import {
  QuestionCircleOutlined,
  FormatPainterOutlined,
  BulbOutlined,
} from "@ant-design/icons";

export default function MarkdownEditor() {
  // State management
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditorScrolling, setIsEditorScrolling] = useState(false);
  const [isPreviewScrolling, setIsPreviewScrolling] = useState(false);

  // Refs
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const monacoRef = useRef(null);

  // Save content to backend (simulated)
  const saveContent = async (newContent) => {
    setSaving(true);
    try {
      // Here you would normally save to a database or API
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error saving content:", error);
    } finally {
      setSaving(false);
    }
  };

  // Debounced save to prevent too many API calls
  const debouncedSave = useCallback(
    debounce((newContent) => {
      saveContent(newContent);
    }, 500),
    []
  );

  // Handle editor change
  const handleEditorChange = (value) => {
    setContent(value || "");
    debouncedSave(value || "");
  };

  // Checkbox toggle implementation
  const handleCheckboxToggle = (index) => {
    const lines = content.split("\n");
    if (index >= 0 && index < lines.length) {
      const line = lines[index];
      // Toggle checkbox state in markdown
      if (line.includes("[ ]")) {
        lines[index] = line.replace("[ ]", "[x]");
      } else if (line.includes("[x]")) {
        lines[index] = line.replace("[x]", "[ ]");
      }
      const newContent = lines.join("\n");
      setContent(newContent);
      debouncedSave(newContent);
    }
  };

  // Helper function to get editor properties safely
  const getEditorScrollInfo = useCallback((editor) => {
    if (!editor) return null;

    if (editor.getScrollInfo) {
      return editor.getScrollInfo();
    }

    // Monaco editor case
    try {
      const scrollTop = editor.getScrollTop();
      const scrollHeight = editor.getContentHeight
        ? editor.getContentHeight()
        : editor.getScrollHeight();
      const clientHeight = editor.getLayoutInfo
        ? editor.getLayoutInfo().height
        : editor.getClientHeight();

      return {
        top: scrollTop,
        height: scrollHeight - clientHeight,
      };
    } catch (error) {
      console.error("Error getting editor scroll info:", error);
      return null;
    }
  }, []);

  // Set up editor scroll sync
  const handleEditorScroll = useCallback(() => {
    if (isPreviewScrolling || !editorRef.current || !previewRef.current) return;

    setIsEditorScrolling(true);

    const editor = editorRef.current;
    const preview = previewRef.current;
    const editorInfo = getEditorScrollInfo(editor);

    if (editorInfo) {
      const scrollPercentage = editorInfo.top / Math.max(editorInfo.height, 1);
      const previewScrollTop =
        scrollPercentage *
        Math.max(preview.scrollHeight - preview.clientHeight, 0);
      preview.scrollTop = previewScrollTop;
    }

    setTimeout(() => setIsEditorScrolling(false), 100);
  }, [isPreviewScrolling, getEditorScrollInfo]);

  // Set up preview scroll sync
  const handlePreviewScroll = useCallback(() => {
    if (isEditorScrolling || !editorRef.current || !previewRef.current) return;

    setIsPreviewScrolling(true);

    const editor = editorRef.current;
    const preview = previewRef.current;

    const previewScrollHeight = Math.max(
      preview.scrollHeight - preview.clientHeight,
      1
    );
    const scrollPercentage = preview.scrollTop / previewScrollHeight;

    if (editor.setScrollTop) {
      const editorScrollHeight = editor.getScrollHeight
        ? editor.getScrollHeight()
        : editor.getContentHeight
        ? editor.getContentHeight()
        : 0;

      const editorClientHeight = editor.getLayoutInfo
        ? editor.getLayoutInfo().height
        : editor.getDomNode().clientHeight;

      const maxScroll = Math.max(editorScrollHeight - editorClientHeight, 0);

      // Apply smoother scrolling with requestAnimationFrame
      requestAnimationFrame(() => {
        editor.setScrollTop(scrollPercentage * maxScroll);
      });
    }

    // Give more time for the scrolling to complete before allowing reverse sync
    setTimeout(() => setIsPreviewScrolling(false), 200);
  }, [isEditorScrolling]);

  // Hook up the editor scroll events
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    // Monaco Editor scroll handling
    if (editor.onDidScrollChange) {
      const disposable = editor.onDidScrollChange(() => {
        handleEditorScroll();
      });

      // Apply initial sync if needed
      setTimeout(handleEditorScroll, 500);

      return () => disposable.dispose();
    }
  }, [handleEditorScroll, editorRef.current]);

  // Ensure both components are properly synced after initial render
  useEffect(() => {
    // Apply initial sync when content changes
    if (content && editorRef.current && previewRef.current) {
      setTimeout(handleEditorScroll, 300);
    }
  }, [content, handleEditorScroll]);

  // Configure Monaco's suggestion provider
  const configureSuggestionProvider = (monaco) => {
    // Register a completion item provider for markdown language
    monaco.languages.registerCompletionItemProvider("markdown", {
      triggerCharacters: [
        "@",
        ":",
        "#",
        "[",
        "!",
        "`",
        "-",
        "*",
        "+",
        "1",
        "2",
        "3",
      ],

      provideCompletionItems: (model, position) => {
        // Get text content of current line up to cursor position
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const wordAtPosition = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordAtPosition.startColumn,
          endColumn: wordAtPosition.endColumn,
        };

        const suggestions = [];

        // Check for markdown syntax triggers
        if (textUntilPosition.match(/^#{1,6}\s*$/)) {
          // Header suggestions
          return {
            suggestions: [
              {
                label: "🚀 Introduction",
                kind: monaco.languages.CompletionItemKind.Text,
                insertText: " 🚀 Introduction",
                range,
              },
              {
                label: "🏁 Getting Started",
                kind: monaco.languages.CompletionItemKind.Text,
                insertText: " 🏁 Getting Started",
                range,
              },
              {
                label: "🎯 Conclusion",
                kind: monaco.languages.CompletionItemKind.Text,
                insertText: " 🎯 Conclusion",
                range,
              },
              {
                label: "📝 Summary",
                kind: monaco.languages.CompletionItemKind.Text,
                insertText: " 📝 Summary",
                range,
              },
            ],
          };
        }

        // Table suggestion
        if (textUntilPosition.match(/@table(:\d+:\d+)?$/)) {
          const tableMatch = textUntilPosition.match(
            /@table(?::(\d+):(\d+))?$/
          );
          const columns =
            tableMatch && tableMatch[1] ? parseInt(tableMatch[1], 10) : 3;
          const rows =
            tableMatch && tableMatch[2] ? parseInt(tableMatch[2], 10) : 2;

          // Create table header with placeholders
          const headerRow =
            "| " +
            Array(columns)
              .fill("${placeholder}")
              .map((_, i) => `\${${i + 1}:Header ${i + 1}}`)
              .join(" | ") +
            " |";
          const separatorRow =
            "| " + Array(columns).fill("--------").join(" | ") + " |";

          // Create table body rows with placeholders
          const bodyRows = [];
          for (let i = 0; i < rows; i++) {
            const rowCells = [];
            for (let j = 0; j < columns; j++) {
              const placeholderIndex = columns + i * columns + j + 1;
              rowCells.push(`\${${placeholderIndex}:Cell ${i + 1}-${j + 1}}`);
            }
            bodyRows.push("| " + rowCells.join(" | ") + " |");
          }

          // Combine all rows
          const tableText = [headerRow, separatorRow, ...bodyRows].join("\n");

          return {
            suggestions: [
              {
                label: tableMatch[0],
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: tableText,
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: `Insert a markdown table with ${columns} columns and ${rows} rows`,
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - tableMatch[0].length,
                  endColumn: position.column,
                },
              },
            ],
          };
        }

        // Code block suggestion
        if (textUntilPosition.endsWith("@code")) {
          return {
            suggestions: [
              {
                label: "@code",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "```${1:language}\n${2:// code here}\n```",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Insert a code block",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - 5,
                  endColumn: position.column,
                },
              },
            ],
          };
        }

        // Link suggestion
        if (textUntilPosition.endsWith("@link")) {
          return {
            suggestions: [
              {
                label: "@link",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "[${1:link text}](${2:url})",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Insert a markdown link",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - 5,
                  endColumn: position.column,
                },
              },
            ],
          };
        }

        // Image suggestion
        if (textUntilPosition.endsWith("@image")) {
          return {
            suggestions: [
              {
                label: "@image",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "![${1:alt text}](${2:image-url})",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Insert a markdown image",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - 6,
                  endColumn: position.column,
                },
              },
            ],
          };
        }

        // Task list suggestion
        if (textUntilPosition.endsWith("@task")) {
          return {
            suggestions: [
              {
                label: "@task",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "- [ ] ${1:Task description}",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Insert a task item",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - 5,
                  endColumn: position.column,
                },
              },
            ],
          };
        }

        // Callout/admonition suggestions
        if (textUntilPosition.endsWith("@note")) {
          return {
            suggestions: [
              {
                label: "@note",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "> **Note**\n> ${1:Note content}",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Insert a note callout",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - 5,
                  endColumn: position.column,
                },
              },
            ],
          };
        }

        if (textUntilPosition.endsWith("@warning")) {
          return {
            suggestions: [
              {
                label: "@warning",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "> **Warning**\n> ${1:Warning content}",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Insert a warning callout",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - 8,
                  endColumn: position.column,
                },
              },
            ],
          };
        }

        // Detect if we're in a list context and provide item suggestion
        if (textUntilPosition.match(/^(\s*[-*+]\s+)$/)) {
          suggestions.push({
            label: "List item",
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: "List item",
            range,
          });
        }

        // Add markdown syntax suggestions via @ commands
        if (textUntilPosition.endsWith("@")) {
          return {
            suggestions: [
              {
                label: "@link",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "link",
                documentation: "Insert a markdown link",
                range,
              },
              {
                label: "@image",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "image",
                documentation: "Insert a markdown image",
                range,
              },
              {
                label: "@code",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "code",
                documentation: "Insert a code block",
                range,
              },
              {
                label: "@table",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "table",
                documentation: "Insert a markdown table",
                range,
              },
              {
                label: "@task",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "task",
                documentation: "Insert a task item",
                range,
              },
              {
                label: "@note",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "note",
                documentation: "Insert a note callout",
                range,
              },
              {
                label: "@warning",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "warning",
                documentation: "Insert a warning callout",
                range,
              },
            ],
          };
        }

        return { suggestions };
      },
    });
  };

  // Setup editor shortcuts and completion providers
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco's suggestion provider
    configureSuggestionProvider(monaco);

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyB, () => {
      insertMarkdownSyntax("**", "**", "bold text");
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyI, () => {
      insertMarkdownSyntax("*", "*", "italic text");
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyK, () => {
      insertMarkdownSyntax("[", "](url)", "link text");
    });

    editor.addCommand(
      monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyX,
      () => {
        insertMarkdownSyntax("- [ ] ", "", "Task item");
      }
    );

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyE, () => {
      insertMarkdownSyntax("`", "`", "code");
    });

    editor.addCommand(
      monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyE,
      () => {
        insertMarkdownSyntax("```\n", "\n```", "code block");
      }
    );

    // Configure auto-continuation of lists
    editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Enter) {
        const model = editor.getModel();
        const position = editor.getPosition();
        const lineContent = model.getLineContent(position.lineNumber);

        // Check for list items (-, *, +) or numbered list (1., 2., etc)
        const listMatch = lineContent.match(/^(\s*)([-*+]|(\d+\.))\s(.*)/);

        if (listMatch) {
          const [, indentation, listMarker, numberedListMarker, content] =
            listMatch;

          // Only continue list if content exists (not empty list item)
          if (content.trim()) {
            e.preventDefault();

            // For numbered lists, increment the number
            let newListMarker = listMarker;
            if (numberedListMarker) {
              const num = parseInt(listMarker);
              newListMarker = num + 1 + ".";
            }

            // If the list item is a task
            const isTask =
              content.startsWith("[ ] ") || content.startsWith("[x] ");
            const taskMarker = isTask ? "[ ] " : "";

            // Insert new line and list marker
            editor.executeEdits("auto-list", [
              {
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
                text: "\n" + indentation + newListMarker + " " + taskMarker,
              },
            ]);

            // Position cursor after the list marker in the new line
            const newColumn =
              indentation.length + newListMarker.length + 2 + taskMarker.length;
            editor.setPosition({
              lineNumber: position.lineNumber + 1,
              column: newColumn,
            });

            return;
          }
        }
      }

      // Handle Tab and Shift+Tab for list indentation/dedentation
      if (e.keyCode === monaco.KeyCode.Tab) {
        const model = editor.getModel();
        const position = editor.getPosition();
        const lineContent = model.getLineContent(position.lineNumber);

        // Check if we're in a list item line
        const listMatch = lineContent.match(/^(\s*)([-*+]|(\d+\.))\s(.*)/);

        if (listMatch) {
          e.preventDefault();

          if (e.shiftKey) {
            // Dedent - remove 2 spaces if they exist
            if (listMatch[1].length >= 2) {
              const range = {
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: 3,
              };

              editor.executeEdits("list-dedent", [
                {
                  range,
                  text: "",
                },
              ]);
            }
          } else {
            // Indent - add 2 spaces at beginning of line
            const range = {
              startLineNumber: position.lineNumber,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: 1,
            };

            editor.executeEdits("list-indent", [
              {
                range,
                text: "  ",
              },
            ]);

            // Move cursor to maintain its relative position
            const newPosition = {
              lineNumber: position.lineNumber,
              column: position.column + 1,
            };
            editor.setPosition(newPosition);
          }

          return;
        }
      }
    });

    // Add heading keyboard shortcuts
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Digit1,
      () => {
        insertMarkdownSyntax("# ", "", "Heading 1");
      }
    );

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Digit2,
      () => {
        insertMarkdownSyntax("## ", "", "Heading 2");
      }
    );

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Digit3,
      () => {
        insertMarkdownSyntax("### ", "", "Heading 3");
      }
    );

    editor.addCommand(
      monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
      () => {
        insertMarkdownSyntax("- ", "", "List item");
      }
    );

    editor.addCommand(
      monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyN,
      () => {
        insertMarkdownSyntax("1. ", "", "Numbered list item");
      }
    );

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        formatMarkdown();
      }
    );
  };

  // Helper function to insert markdown syntax
  const insertMarkdownSyntax = (prefix, suffix, placeholder) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const selection = editor.getSelection();
    const model = editor.getModel();
    const selectedText = model.getValueInRange(selection);

    let newText;
    let newPosition;

    if (selectedText) {
      // If text is selected, wrap it with the markdown syntax
      newText = prefix + selectedText + suffix;
      editor.executeEdits("markdown-shortcut", [
        { range: selection, text: newText },
      ]);

      // Position cursor after the insertion
      const newSelectionEnd = {
        lineNumber: selection.endLineNumber,
        column: selection.endColumn + prefix.length + suffix.length,
      };
      editor.setPosition(newSelectionEnd);
    } else {
      // If no text is selected, insert the syntax with placeholder
      newText = prefix + placeholder + suffix;

      const cursorPos = editor.getPosition();
      editor.executeEdits("markdown-shortcut", [
        {
          range: {
            startLineNumber: cursorPos.lineNumber,
            startColumn: cursorPos.column,
            endLineNumber: cursorPos.lineNumber,
            endColumn: cursorPos.column,
          },
          text: newText,
        },
      ]);

      // Select the placeholder text
      const newSelection = {
        startLineNumber: cursorPos.lineNumber,
        startColumn: cursorPos.column + prefix.length,
        endLineNumber: cursorPos.lineNumber,
        endColumn: cursorPos.column + prefix.length + placeholder.length,
      };
      editor.setSelection(newSelection);
    }
  };

  // Function to format markdown content
  const formatMarkdown = () => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    const value = model.getValue();

    // Apply formatting rules
    let formatted = value;

    // Fix header spacing (# Header instead of #Header)
    formatted = formatted.replace(/^(#+)([^\s#])/gm, "$1 $2");

    // Fix list item spacing (- Item instead of -Item)
    formatted = formatted.replace(/^(\s*[-*+])([^\s])/gm, "$1 $2");

    // Fix numbered list spacing (1. Item instead of 1.Item)
    formatted = formatted.replace(/^(\s*\d+\.)([^\s])/gm, "$1 $2");

    // Normalize line endings (ensure consistent empty lines between blocks)
    formatted = formatted.replace(/\n{3,}/g, "\n\n");

    // Fix spacing after code block markers
    formatted = formatted.replace(/^```(\w+)?([^\n])/gm, "```$1\n$2");

    // Fix end of code blocks
    formatted = formatted.replace(/([^\n])```$/gm, "$1\n```");

    // Apply the formatted content if there are changes
    if (formatted !== value) {
      editor.executeEdits("format-markdown", [
        {
          range: model.getFullModelRange(),
          text: formatted,
        },
      ]);

      // Update content state
      setContent(formatted);
      debouncedSave(formatted);
    }
  };

  const shortcutContent = (
    <div className="p-2">
      <div className="text-lg font-semibold mb-2">Keyboard Shortcuts</div>
      <List
        size="small"
        dataSource={[
          { shortcut: "Alt + B", desc: "Bold" },
          { shortcut: "Alt + I", desc: "Italic" },
          { shortcut: "Alt + K", desc: "Link" },
          { shortcut: "Alt + Shift + X", desc: "Task Item" },
          { shortcut: "Alt + E", desc: "Inline Code" },
          { shortcut: "Ctrl + Shift + F", desc: "Format Markdown" },
          { shortcut: "Alt + Shift + E", desc: "Code Block" },
          { shortcut: "Ctrl + Alt + 1-3", desc: "Headings" },
          { shortcut: "Alt + Shift + L", desc: "List Item" },
          { shortcut: "Alt + Shift + N", desc: "Numbered List Item" },
        ]}
        renderItem={(item) => (
          <List.Item>
            <Tag>{item.shortcut}</Tag> {item.desc}
          </List.Item>
        )}
      />
      <p className="text-xs text-gray-500 mt-1">
        Use these shortcuts to quickly format your markdown content.
      </p>
    </div>
  );

  const suggestionHelpContent = (
    <div className="p-2">
      <div className="text-lg font-semibold mb-2">Auto-suggestions</div>
      <p>
        Type <Tag>@</Tag> to access these markdown snippets:
      </p>
      <List
        size="small"
        dataSource={[
          { tag: "@link", desc: "Insert link" },
          { tag: "@image", desc: "Insert image" },
          { tag: "@code", desc: "Insert code block" },
          { tag: "@table", desc: "Insert table (@table:3:2 for custom size)" },
          { tag: "@task", desc: "Insert task item" },
          { tag: "@note", desc: "Insert note callout" },
          { tag: "@warning", desc: "Insert warning callout" },
        ]}
        renderItem={(item) => (
          <List.Item>
            <Tag>{item.tag}</Tag> {item.desc}
          </List.Item>
        )}
      />
      <p className="text-xs text-gray-500 mt-1">
        Additional suggestions appear as you type headers and lists.
      </p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <Card
          size="small"
          title="Editor"
          extra={
            <>
              <Button
                type="text"
                icon={<FormatPainterOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  formatMarkdown();
                }}
                title="Format Markdown (Ctrl+Shift+F)"
              />
              <Popover content={shortcutContent} trigger="hover">
                <Button
                  type="text"
                  icon={<QuestionCircleOutlined />}
                  onClick={(e) => e.stopPropagation()}
                  title="Keyboard shortcuts"
                />
              </Popover>
              <Popover content={suggestionHelpContent} trigger="hover">
                <Button
                  type="text"
                  icon={<BulbOutlined />}
                  onClick={(e) => e.stopPropagation()}
                  title="Suggestion help"
                />
              </Popover>
            </>
          }
        >
          <MonacoEditor
            height="500px"
            defaultLanguage="markdown"
            value={content}
            onChange={handleEditorChange}
            theme="vs-light"
            options={{
              wordWrap: "on",
              minimap: { enabled: false },
              lineNumbers: "on",
              folding: true,
              scrollBeyondLastLine: false,
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true,
              },
              tabSize: 2,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
              snippetSuggestions: "on",
            }}
            onMount={handleEditorDidMount}
            beforeMount={(monaco) => {
              window.monaco = monaco;
            }}
          />
        </Card>

        {/* Preview Panel */}
        <Card size="small" title="Preview">
          <MarkdownPreview
            content={content}
            ref={previewRef}
            onScroll={handlePreviewScroll}
            onCheckboxToggle={handleCheckboxToggle}
          />
        </Card>
      </div>

      {saving && (
        <div className="flex gap-1 items-center mt-2">
          <Spin size="small" />
          <span className="text-xs text-gray-500">Saving...</span>
        </div>
      )}
    </>
  );
}
