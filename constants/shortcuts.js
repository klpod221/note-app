// Key shortcut definitions for the entire application

// Note List shortcuts
export const NOTE_LIST_SHORTCUTS = {
  NEW_NOTE: { key: "n", altKey: true, desc: "New Note" },
  NEW_FOLDER: { key: "f", altKey: true, desc: "New Folder" },
  REFRESH: { key: "r", altKey: true, desc: "Refresh" },
  SEARCH: { key: "s", altKey: true, desc: "Search" },
};

// Editor shortcuts
export const EDITOR_SHORTCUTS = {
  BOLD: { key: "b", altKey: true, desc: "Bold" },
  ITALIC: { key: "i", altKey: true, desc: "Italic" },
  LINK: { key: "k", altKey: true, desc: "Link" },
  TASK_ITEM: { key: "x", altKey: true, shiftKey: true, desc: "Task Item" },
  INLINE_CODE: { key: "e", altKey: true, desc: "Inline Code" },
  FORMAT: { key: "f", ctrlKey: true, shiftKey: true, desc: "Format Markdown" },
  CODE_BLOCK: { key: "e", altKey: true, shiftKey: true, desc: "Code Block" },
  HEADING_1: { key: "1", ctrlKey: true, altKey: true, desc: "Heading 1" },
  HEADING_2: { key: "2", ctrlKey: true, altKey: true, desc: "Heading 2" },
  HEADING_3: { key: "3", ctrlKey: true, altKey: true, desc: "Heading 3" },
  LIST_ITEM: { key: "l", altKey: true, shiftKey: true, desc: "List Item" },
  NUMBERED_LIST_ITEM: {
    key: "n",
    altKey: true,
    shiftKey: true,
    desc: "Numbered List Item",
  },
  FULLSCREEN: { key: "F11", altKey: true, desc: "Toggle Fullscreen" },
  FULLSCREEN_EXIT: { key: "Escape", desc: "Exit Fullscreen" },
};

// Suggestions help text for UI
export const EDITOR_SUGGESTIONS_HELP = [
  { tag: "@link", desc: "Insert link" },
  { tag: "@image", desc: "Insert image" },
  { tag: "@code", desc: "Insert code block" },
  { tag: "@table", desc: "Insert table (@table:3:2 for custom size)" },
  { tag: "@task", desc: "Insert task item" },
  { tag: "@note", desc: "Insert note callout" },
  { tag: "@warning", desc: "Insert warning callout" },
];
