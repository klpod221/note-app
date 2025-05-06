"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import debounce from "lodash.debounce";
import useNoteStore from "@/store/noteStore";
import useWindowSize from "@/hooks/useWindowSize";
import { formatShortcut } from "@/utils/helperUtils";
import {
  EDITOR_SUGGESTIONS_HELP,
  EDITOR_SHORTCUTS,
} from "@/constants/shortcuts";

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
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";

export default function NoteEditor({ updateNote = null, content = "" }) {
  const { note } = useNoteStore();
  const [noteContent, setNoteContent] = useState(content);
  const [viewMode, setViewMode] = useState("split"); // 'edit', 'preview', 'split'
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScrollSyncEnabled, setIsScrollSyncEnabled] = useState(true);

  // Use the window size hook
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 768;

  // Refs for scroll synchronization
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const editorContainerRef = useRef(null);

  // Update view mode when switching to mobile
  useEffect(() => {
    if (isMobile && viewMode === "split") {
      setViewMode("edit");
    }
  }, [isMobile, viewMode]);

  // Update local content when note changes or when content prop changes
  useEffect(() => {
    if (note && note.id) {
      setNoteContent(note.content);
    } else if (content) {
      setNoteContent(content);
    }
  }, [note, content]);

  // Recalculate dimensions when view mode changes
  useEffect(() => {
    // Temporarily disable scroll sync during transition
    setIsScrollSyncEnabled(false);

    // Allow DOM to update before re-enabling scroll sync
    const timer = setTimeout(() => {
      setIsScrollSyncEnabled(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [viewMode]);

  // Check if note is deleted (read-only)
  const isNoteDeleted =
    note && note.deletedAt !== undefined && note.deletedAt !== null;

  const saveNote = async (content) => {
    if (!updateNote || typeof updateNote !== "function" || isNoteDeleted) {
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
    if (viewMode !== "split" || !previewRef.current || !isScrollSyncEnabled)
      return;

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
    if (viewMode !== "split" || !editorRef.current || !isScrollSyncEnabled)
      return;

    const preview = e.target;
    const editor = editorRef.current;

    if (!preview || !editor) return;

    const previewHeight = preview.scrollHeight - preview.clientHeight;
    if (previewHeight <= 0) return; // Prevent division by zero

    const scrollPercentage = preview.scrollTop / previewHeight;
    const editorScrollHeight = editor.scrollHeight - editor.clientHeight;

    // Apply scroll to editor without triggering its scroll handler
    editor.setScrollTop(scrollPercentage * editorScrollHeight);
  };

  // Show deleted note warning
  const isReadOnly = isNoteDeleted;

  const shortcutContent = (
    <div className="p-2">
      <div className="text-lg font-semibold mb-2">Keyboard Shortcuts</div>
      <List
        size="small"
        dataSource={Object.values(EDITOR_SHORTCUTS)}
        renderItem={(item) => (
          <List.Item>
            <Tag>{formatShortcut(item)}</Tag> {item.desc}
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
        dataSource={EDITOR_SUGGESTIONS_HELP}
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

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle ESC key to exit fullscreen and Alt+F11 to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Exit fullscreen with ESC key
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }

      // Toggle fullscreen with Alt+F11
      if (e.key === "F11" && e.altKey) {
        e.preventDefault(); // Prevent browser's default F11 behavior
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return (
    <div
      className={`flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-full"
      }`}
      ref={editorContainerRef}
    >
      {/* Toolbar - keeping the same layout for desktop and mobile */}
      <div className="bg-white border-b border-gray-200 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* View mode toggles */}
            <Tooltip title="Edit mode">
              <Button
                type={viewMode === "edit" ? "primary" : "default"}
                icon={<EditOutlined />}
                onClick={() => setViewMode("edit")}
                disabled={isReadOnly}
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>
            <Tooltip title="Preview mode">
              <Button
                type={viewMode === "preview" ? "primary" : "default"}
                icon={<EyeOutlined />}
                onClick={() => setViewMode("preview")}
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>
            {/* Only show split mode button on desktop */}
            {!isMobile && (
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
            )}
            <Divider type="vertical" />
            <Tooltip
              title={isReadOnly ? "Cannot save deleted notes" : "Manual save"}
            >
              <Button
                onClick={() => saveNote(noteContent)}
                icon={<SaveOutlined />}
                className="flex"
                loading={isSaving}
                disabled={
                  isReadOnly || !updateNote || typeof updateNote !== "function"
                }
                size={isMobile ? "small" : "middle"}
              >
                {isMobile ? "" : "Save"}
              </Button>
            </Tooltip>
            {isReadOnly && (
              <Tag color="error" className={isMobile ? "text-xs" : "ml-2"}>
                {isMobile ? "Read-only" : "Deleted Note (Read-only)"}
              </Tag>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip
              title={
                EDITOR_SHORTCUTS.FORMAT.desc +
                ` (${formatShortcut(EDITOR_SHORTCUTS.FORMAT)})`
              }
            >
              <Button
                type="text"
                icon={<FormatPainterOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  formatMarkdown();
                }}
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>
            <Popover
              content={shortcutContent}
              trigger={isMobile ? "click" : "hover"}
            >
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={(e) => e.stopPropagation()}
                size={isMobile ? "small" : "middle"}
              />
            </Popover>
            <Popover
              content={suggestionHelpContent}
              trigger={isMobile ? "click" : "hover"}
            >
              <Button
                type="text"
                icon={<BulbOutlined />}
                onClick={(e) => e.stopPropagation()}
                size={isMobile ? "small" : "middle"}
              />
            </Popover>
            <Tooltip
              title={
                isFullscreen
                  ? EDITOR_SHORTCUTS.FULLSCREEN_EXIT.desc +
                    ` (${formatShortcut(EDITOR_SHORTCUTS.FULLSCREEN_EXIT)})`
                  : EDITOR_SHORTCUTS.FULLSCREEN.desc +
                    ` (${formatShortcut(EDITOR_SHORTCUTS.FULLSCREEN)})`
              }
            >
              <Button
                type="text"
                icon={
                  isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                onClick={toggleFullscreen}
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div
        className={`flex-grow flex ${
          viewMode === "split" && !isMobile ? "flex-row" : "flex-col"
        } overflow-hidden`}
      >
        {/* Editor */}
        <div
          className={`${
            viewMode === "split" && !isMobile ? "w-1/2" : "w-full"
          } ${
            viewMode === "split" && isMobile ? "h-1/2" : ""
          } h-full overflow-hidden ${
            viewMode === "split" && !isMobile ? "border-r border-gray-200" : ""
          } ${viewMode !== "edit" && viewMode !== "split" ? "hidden" : ""}`}
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
            viewMode === "split" && !isMobile ? "w-1/2" : "w-full"
          } ${
            viewMode === "split" && isMobile ? "h-1/2" : ""
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
