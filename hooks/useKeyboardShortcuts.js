import { useEffect, useCallback } from "react";

/**
 * A hook for registering keyboard shortcuts
 * @param {Object} shortcuts - Object mapping shortcut names to their key configs from shortcuts.js
 * @param {Object} handlers - Object mapping shortcut names to their handler functions
 * @param {Object} monacoRef - Optional reference to Monaco editor (only needed for editor shortcuts)
 * @param {Object} editorRef - Optional reference to editor instance (only needed for editor shortcuts)
 * @param {Array} dependencies - Dependencies array to control when shortcuts should be re-registered
 * @returns {void}
 */
export default function useKeyboardShortcuts(
  shortcuts,
  handlers,
  { monacoRef, editorRef } = {},
  dependencies = []
) {
  const handleKeyDown = useCallback(
    (e) => {
      // Skip if user is typing in an input field
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Check each shortcut definition
      Object.entries(shortcuts).forEach(([shortcutName, shortcutConfig]) => {
        // Check if the key matches
        if (
          e.key.toLowerCase() === shortcutConfig.key.toLowerCase() &&
          !!e.altKey === !!shortcutConfig.altKey &&
          !!e.ctrlKey === !!shortcutConfig.ctrlKey &&
          !!e.shiftKey === !!shortcutConfig.shiftKey
        ) {
          // If we have a handler for this shortcut, call it
          if (handlers[shortcutName]) {
            e.preventDefault();
            handlers[shortcutName](e);
          }
        }
      });
    },
    [shortcuts, handlers]
  );

  // Register Monaco editor commands if Monaco is available
  const registerMonacoShortcuts = useCallback(() => {
    if (!monacoRef?.current || !editorRef?.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Unregister existing commands first if re-registering
    const commandIds = [];

    // Register each shortcut with Monaco
    Object.entries(shortcuts).forEach(([shortcutName, shortcutConfig]) => {
      if (handlers[shortcutName]) {
        let keyCombination = 0;
        
        // Handle alphabetic keys
        if (/^[a-z]$/i.test(shortcutConfig.key)) {
          keyCombination |= monaco.KeyCode[`Key${shortcutConfig.key.toUpperCase()}`];
        } 
        // Handle numeric keys
        else if (/^[0-9]$/.test(shortcutConfig.key)) {
          keyCombination |= monaco.KeyCode[`Digit${shortcutConfig.key}`];
        }
        // Handle special keys like Escape
        else if (typeof shortcutConfig.key === 'string') {
          if (monaco.KeyCode[shortcutConfig.key]) {
            keyCombination |= monaco.KeyCode[shortcutConfig.key];
          }
        }
        
        // Add modifiers
        if (shortcutConfig.ctrlKey) {
          keyCombination |= monaco.KeyMod.CtrlCmd;
        }
        if (shortcutConfig.altKey) {
          keyCombination |= monaco.KeyMod.Alt;
        }
        if (shortcutConfig.shiftKey) {
          keyCombination |= monaco.KeyMod.Shift;
        }
        
        // Register the command with Monaco
        const commandId = `shortcut.${shortcutName}`;
        commandIds.push(commandId);
        
        editor.addCommand(keyCombination, handlers[shortcutName], '');
      }
    });

    // Return a cleanup function to dispose commands if needed
    return () => {
      // Monaco doesn't provide a direct way to unregister commands
      // This is handled by re-registering when dependencies change
    };
  }, [shortcuts, handlers, monacoRef, editorRef]);

  // For normal DOM shortcuts
  useEffect(() => {
    // Skip registering DOM shortcuts if we're using Monaco
    if (monacoRef?.current && editorRef?.current) return;
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, ...dependencies]);

  // For Monaco editor shortcuts
  useEffect(() => {
    if (monacoRef?.current && editorRef?.current) {
      return registerMonacoShortcuts();
    }
  }, [registerMonacoShortcuts, ...dependencies]);
}