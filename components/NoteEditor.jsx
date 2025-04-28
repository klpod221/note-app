"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import useNoteStore from "@/store/noteStore";
import debounce from "lodash.debounce";

import { updateNote } from "@/services/noteService";

import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownPreview from "@/components/MarkdownPreview";

import { Button, Tooltip, Divider, List, Tag, Popover } from "antd";
import {
  SaveOutlined,
  EyeOutlined,
  EditOutlined,
  FormatPainterOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";

export default function NoteEditor() {
  const { note } = useNoteStore();
  const [noteContent, setNoteContent] = useState("");
  const [viewMode, setViewMode] = useState("split"); // 'edit', 'preview', 'split'
  const [isSaving, setIsSaving] = useState(false);

  // Refs for scroll synchronization
  const editorRef = useRef(null);
  const previewRef = useRef(null);

  // Update local content when note changes
  useEffect(() => {
    if (note && note.id) {
      setNoteContent(note.content);
    }
  }, [note]);

  // Check if note is deleted (read-only)
  const isNoteDeleted =
    note && note.deletedAt !== undefined && note.deletedAt !== null;

  const saveNote = async (content) => {
    // Don't allow saving for deleted notes
    if (isNoteDeleted) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await updateNote(note.id, { content });
      if (response.success) {
        console.log("Note saved successfully");
      } else {
        console.error("Failed to save note:", response.error);
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((content) => {
      saveNote(content);
    }, 1000),
    [note]
  );

  // Handle content changes
  const handleContentChange = (content) => {
    // Don't update content if note is deleted
    if (isNoteDeleted) {
      return;
    }

    setNoteContent(content);
    debouncedSave(content);
  };

  // Handle checkbox toggle in preview
  const handleCheckboxToggle = (lineIndex) => {
    const lines = noteContent.split("\n");
    const targetLine = lines[lineIndex];

    if (targetLine) {
      const newLine = targetLine.includes("[ ]")
        ? targetLine.replace("[ ]", "[x]")
        : targetLine.replace("[x]", "[ ]");

      lines[lineIndex] = newLine;
      const newContent = lines.join("\n");

      setNoteContent(newContent);
      debouncedSave(newContent);
    }
  };

  // Scroll synchronization
  const handleEditorScroll = (e) => {
    if (viewMode !== "split" || !previewRef.current) return;

    const editor = editorRef.current;
    const previewElement = previewRef.current;

    if (!editor || !previewElement) return;

    const editorScrollHeight = editor.scrollHeight - editor.clientHeight;
    if (editorScrollHeight <= 0) return; // Prevent division by zero

    const scrollPercentage = e.scrollTop / editorScrollHeight;
    const previewScrollHeight =
      previewElement.scrollHeight - previewElement.clientHeight;

    // Apply scroll to preview without triggering its scroll handler
    previewElement.removeEventListener("scroll", handlePreviewScroll);
    previewElement.scrollTop = scrollPercentage * previewScrollHeight;
    setTimeout(() => {
      previewElement.addEventListener("scroll", handlePreviewScroll);
    }, 100);
  };

  const handlePreviewScroll = (e) => {
    if (viewMode !== "split" || !editorRef.current) return;

    const preview = e.target;
    const editor = editorRef.current;

    if (!preview || !editor) return;

    const previewHeight = preview.scrollHeight - preview.clientHeight;
    if (previewHeight <= 0) return; // Prevent division by zero

    const scrollPercentage = preview.scrollTop / previewHeight;

    // Apply scroll to editor without triggering its scroll handler
    editor.setScrollTop(
      scrollPercentage * (editor.scrollHeight - editor.clientHeight)
    );
  };

  // Show deleted note warning
  const isReadOnly = isNoteDeleted;

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
          {
            tag: "@table",
            desc: "Insert table (@table:3:2 for custom size)",
          },
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
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* View mode toggles */}
          <Tooltip title="Edit mode">
            <Button
              type={viewMode === "edit" ? "primary" : "default"}
              icon={<EditOutlined />}
              onClick={() => setViewMode("edit")}
              disabled={isReadOnly}
            />
          </Tooltip>
          <Tooltip title="Preview mode">
            <Button
              type={viewMode === "preview" ? "primary" : "default"}
              icon={<EyeOutlined />}
              onClick={() => setViewMode("preview")}
            />
          </Tooltip>
          <Tooltip title="Split mode">
            <Button
              type={viewMode === "split" ? "primary" : "default"}
              onClick={() => setViewMode("split")}
              disabled={isReadOnly && viewMode !== "split"}
            >
              <div className="flex items-center">
                <EditOutlined style={{ fontSize: "0.75rem" }} />
                <span className="mx-0.5">|</span>
                <EyeOutlined style={{ fontSize: "0.75rem" }} />
              </div>
            </Button>
          </Tooltip>

          <Divider type="vertical" />

          {/* Save button */}
          <Tooltip
            title={isReadOnly ? "Cannot save deleted notes" : "Manual save"}
          >
            <Button
              onClick={() => saveNote(noteContent)}
              icon={<SaveOutlined />}
              className="flex"
              loading={isSaving}
              disabled={isReadOnly}
            >
              Save
            </Button>
          </Tooltip>

          {isReadOnly && (
            <Tag color="error" className="ml-2">
              Deleted Note (Read-only)
            </Tag>
          )}
        </div>
        <div className="flex items-center gap-1">
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
        </div>
      </div>

      {/* Content area */}
      <div
        className={`flex-grow flex ${
          viewMode === "split" ? "flex-row" : "flex-col"
        } overflow-hidden`}
      >
        {/* Editor */}
        <div
          className={`${
            viewMode === "split" ? "w-1/2" : "w-full"
          } h-full overflow-hidden border-r border-gray-200 ${
            viewMode !== "edit" && viewMode !== "split" ? "hidden" : ""
          }`}
        >
          <MarkdownEditor
            ref={editorRef}
            value={noteContent}
            onChange={handleContentChange}
            onScroll={handleEditorScroll}
            readOnly={isReadOnly}
          />
        </div>

        {/* Preview */}
        <div
          className={`${
            viewMode === "split" ? "w-1/2" : "w-full"
          } h-full overflow-hidden ${
            viewMode !== "preview" && viewMode !== "split" ? "hidden" : ""
          }`}
        >
          <MarkdownPreview
            ref={previewRef}
            content={noteContent}
            onScroll={handlePreviewScroll}
            onCheckboxToggle={handleCheckboxToggle}
          />
        </div>
      </div>
    </div>
  );
}
