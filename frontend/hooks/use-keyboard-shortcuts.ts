"use client";

/**
 * Keyboard Shortcuts Hook
 * Manages keyboard shortcuts with modifier key support
 */

import { useEffect, useCallback, useRef } from "react";

export interface ShortcutConfig {
  /** The key to listen for (e.g., "Space", "Escape", "f") */
  key: string;
  /** Whether Ctrl/Cmd is required */
  ctrl?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt/Option is required */
  alt?: boolean;
  /** Action to execute when shortcut is triggered */
  action: () => void;
  /** Human-readable description for help display */
  description: string;
  /** Whether the shortcut is currently enabled (default: true) */
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  /** Whether to prevent default browser behavior for matched shortcuts */
  preventDefault?: boolean;
  /** Whether shortcuts should work when focused in an input/textarea */
  enableInInputs?: boolean;
}

/**
 * Hook to register and manage keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 'Space', action: () => togglePlay(), description: 'Play/Pause' },
 *   { key: 'Escape', action: () => closePanel(), description: 'Close panel' },
 *   { key: 'f', action: () => fitView(), description: 'Fit view' },
 *   { key: '?', action: () => showHelp(), description: 'Show shortcuts' },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { preventDefault = true, enableInInputs = false } = options;

  // Store shortcuts in ref to avoid re-registering on every render
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if focused in input/textarea and not enabled
      if (!enableInInputs) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const currentShortcuts = shortcutsRef.current;

      for (const shortcut of currentShortcuts) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) continue;

        // Check modifier keys
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // Normalize key comparison
        const pressedKey = normalizeKey(event.key);
        const targetKey = normalizeKey(shortcut.key);
        const keyMatch = pressedKey === targetKey;

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [preventDefault, enableInInputs]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Normalize key names for comparison
 */
function normalizeKey(key: string): string {
  const normalized = key.toLowerCase();

  // Handle special key names
  switch (normalized) {
    case " ":
    case "spacebar":
      return "space";
    case "esc":
      return "escape";
    case "enter":
    case "return":
      return "enter";
    case "arrowup":
      return "up";
    case "arrowdown":
      return "down";
    case "arrowleft":
      return "left";
    case "arrowright":
      return "right";
    case "backspace":
    case "delete":
      return normalized; // Keep as-is but ensure lowercase
    default:
      return normalized;
  }
}

/**
 * Format shortcut for display (e.g., "Ctrl+F" or "⌘F")
 */
export function formatShortcut(shortcut: ShortcutConfig, useMacSymbols = true): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  if (shortcut.ctrl) {
    parts.push(isMac && useMacSymbols ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(isMac && useMacSymbols ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(isMac && useMacSymbols ? "⇧" : "Shift");
  }

  // Format the key
  let keyDisplay = shortcut.key;
  switch (shortcut.key.toLowerCase()) {
    case "space":
      keyDisplay = "Space";
      break;
    case "escape":
    case "esc":
      keyDisplay = "Esc";
      break;
    case "enter":
    case "return":
      keyDisplay = isMac && useMacSymbols ? "↩" : "Enter";
      break;
    case "backspace":
      keyDisplay = isMac && useMacSymbols ? "⌫" : "Backspace";
      break;
    case "delete":
      keyDisplay = isMac && useMacSymbols ? "⌦" : "Delete";
      break;
    case "tab":
      keyDisplay = isMac && useMacSymbols ? "⇥" : "Tab";
      break;
    case "arrowup":
    case "up":
      keyDisplay = "↑";
      break;
    case "arrowdown":
    case "down":
      keyDisplay = "↓";
      break;
    case "arrowleft":
    case "left":
      keyDisplay = "←";
      break;
    case "arrowright":
    case "right":
      keyDisplay = "→";
      break;
    default:
      keyDisplay = shortcut.key.toUpperCase();
  }

  parts.push(keyDisplay);

  return useMacSymbols && isMac ? parts.join("") : parts.join("+");
}
