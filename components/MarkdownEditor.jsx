"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import MonacoEditor from "@monaco-editor/react";

export default forwardRef(function MarkdownEditor({ value, onChange, onScroll, readOnly = false }, ref) {
  // Refs
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const containerRef = useRef(null);

  // Expose editor ref to parent component
  useImperativeHandle(ref, () => ({
    scrollTop: editorRef.current ? editorRef.current.getScrollTop() : 0,
    scrollHeight: editorRef.current ? editorRef.current.getScrollHeight() : 0,
    clientHeight: containerRef.current ? containerRef.current.clientHeight : 0,
    setScrollTop: (value) => {
      if (editorRef.current) editorRef.current.setScrollTop(value);
    }
  }));

  // Helper function to insert markdown syntax
  const insertMarkdownSyntax = (prefix, suffix, placeholder) => {
    if (!editorRef.current || readOnly) return;

    const editor = editorRef.current;
    const selection = editor.getSelection();
    const model = editor.getModel();
    const selectedText = model.getValueInRange(selection);

    let newText;

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
    if (!editorRef.current || readOnly) return;

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
      onChange(formatted);
    }
  };

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

    // Add editor scroll event listener
    editor.onDidScrollChange((e) => {
      if (onScroll) {
        onScroll(e);
      }
    });

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
      if (readOnly) return; // Don't process keyboard events in readonly mode
      
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

  return (
    <div ref={containerRef} className="h-full">
      <MonacoEditor
        defaultLanguage="markdown"
        value={value}
        onChange={readOnly ? undefined : onChange}
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
          readOnly: readOnly,
        }}
        onMount={handleEditorDidMount}
        beforeMount={(monaco) => {
          window.monaco = monaco;
        }}
      />
    </div>
  );
});
