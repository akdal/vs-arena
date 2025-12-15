/**
 * Tests for useKeyboardShortcuts hook
 * Keyboard shortcuts management with modifier key support
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut, type ShortcutConfig } from '@/hooks/use-keyboard-shortcuts';

// Helper to dispatch keyboard events
function pressKey(
  key: string,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean; target?: HTMLElement } = {}
) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: options.ctrl ?? false,
    shiftKey: options.shift ?? false,
    altKey: options.alt ?? false,
    metaKey: options.meta ?? false,
    bubbles: true,
  });

  // Allow setting custom target
  if (options.target) {
    Object.defineProperty(event, 'target', { value: options.target });
  }

  window.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic key handling', () => {
    it('triggers action on matching key press', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('f');

      expect(action).toHaveBeenCalledOnce();
    });

    it('does not trigger on non-matching key', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('g');

      expect(action).not.toHaveBeenCalled();
    });

    it('handles multiple shortcuts', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action: action1, description: 'Fit view' },
        { key: 'p', action: action2, description: 'Toggle panel' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('f');
      pressKey('p');

      expect(action1).toHaveBeenCalledOnce();
      expect(action2).toHaveBeenCalledOnce();
    });

    it('handles case insensitive keys', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'F', action, description: 'Fit view' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('f');

      expect(action).toHaveBeenCalledOnce();
    });
  });

  describe('modifier keys', () => {
    it('triggers with ctrl modifier', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 's', ctrl: true, action, description: 'Save' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Without ctrl - should not trigger
      pressKey('s');
      expect(action).not.toHaveBeenCalled();

      // With ctrl - should trigger
      pressKey('s', { ctrl: true });
      expect(action).toHaveBeenCalledOnce();
    });

    it('triggers with meta key (Mac cmd) when ctrl is required', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 's', ctrl: true, action, description: 'Save' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('s', { meta: true });

      expect(action).toHaveBeenCalledOnce();
    });

    it('triggers with shift modifier', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: '?', shift: true, action, description: 'Help' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('?', { shift: true });

      expect(action).toHaveBeenCalledOnce();
    });

    it('triggers with alt modifier', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'n', alt: true, action, description: 'New item' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('n', { alt: true });

      expect(action).toHaveBeenCalledOnce();
    });

    it('triggers with combined modifiers', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 's', ctrl: true, shift: true, action, description: 'Save As' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Only ctrl - should not trigger
      pressKey('s', { ctrl: true });
      expect(action).not.toHaveBeenCalled();

      // Ctrl + Shift - should trigger
      pressKey('s', { ctrl: true, shift: true });
      expect(action).toHaveBeenCalledOnce();
    });

    it('does not trigger when extra modifier is pressed', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // With ctrl - should not trigger (shortcut doesn't expect ctrl)
      pressKey('f', { ctrl: true });

      expect(action).not.toHaveBeenCalled();
    });
  });

  describe('key normalization', () => {
    it('normalizes Space key', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'Space', action, description: 'Play/Pause' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey(' ');

      expect(action).toHaveBeenCalledOnce();
    });

    it('normalizes Escape/Esc key', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'Escape', action, description: 'Close' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('Escape');

      expect(action).toHaveBeenCalledOnce();
    });

    it('normalizes arrow keys', () => {
      const leftAction = vi.fn();
      const rightAction = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'left', action: leftAction, description: 'Previous' },
        { key: 'right', action: rightAction, description: 'Next' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('ArrowLeft');
      pressKey('ArrowRight');

      expect(leftAction).toHaveBeenCalledOnce();
      expect(rightAction).toHaveBeenCalledOnce();
    });

    it('normalizes Enter/Return key', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'Enter', action, description: 'Confirm' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('Enter');

      expect(action).toHaveBeenCalledOnce();
    });
  });

  describe('input focus handling', () => {
    it('ignores shortcuts when focused in input by default', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const input = document.createElement('input');
      pressKey('f', { target: input });

      expect(action).not.toHaveBeenCalled();
    });

    it('ignores shortcuts when focused in textarea by default', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const textarea = document.createElement('textarea');
      pressKey('f', { target: textarea });

      expect(action).not.toHaveBeenCalled();
    });

    it('allows shortcuts in inputs when enableInInputs is true', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'Escape', action, description: 'Close' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts, { enableInInputs: true }));

      const input = document.createElement('input');
      pressKey('Escape', { target: input });

      expect(action).toHaveBeenCalledOnce();
    });
  });

  describe('disabled shortcuts', () => {
    it('does not trigger disabled shortcuts', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view', enabled: false },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('f');

      expect(action).not.toHaveBeenCalled();
    });

    it('triggers enabled shortcuts when enabled is true', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view', enabled: true },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('f');

      expect(action).toHaveBeenCalledOnce();
    });

    it('triggers shortcuts when enabled is undefined (default)', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      pressKey('f');

      expect(action).toHaveBeenCalledOnce();
    });
  });

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const action = vi.fn();
      const shortcuts: ShortcutConfig[] = [
        { key: 'f', action, description: 'Fit view' },
      ];

      const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

      unmount();

      pressKey('f');

      expect(action).not.toHaveBeenCalled();
    });
  });
});

describe('formatShortcut', () => {
  // Save and restore navigator.platform
  const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(navigator, 'platform', originalPlatform);
    }
  });

  function mockPlatform(platform: string) {
    Object.defineProperty(navigator, 'platform', {
      value: platform,
      configurable: true,
    });
  }

  describe('non-Mac formatting', () => {
    beforeEach(() => {
      mockPlatform('Win32');
    });

    it('formats simple key', () => {
      const shortcut: ShortcutConfig = { key: 'f', action: vi.fn(), description: 'Fit' };
      expect(formatShortcut(shortcut)).toBe('F');
    });

    it('formats with Ctrl', () => {
      const shortcut: ShortcutConfig = { key: 's', ctrl: true, action: vi.fn(), description: 'Save' };
      expect(formatShortcut(shortcut)).toBe('Ctrl+S');
    });

    it('formats with Alt', () => {
      const shortcut: ShortcutConfig = { key: 'n', alt: true, action: vi.fn(), description: 'New' };
      expect(formatShortcut(shortcut)).toBe('Alt+N');
    });

    it('formats with Shift', () => {
      const shortcut: ShortcutConfig = { key: 'p', shift: true, action: vi.fn(), description: 'Print' };
      expect(formatShortcut(shortcut)).toBe('Shift+P');
    });

    it('formats with multiple modifiers', () => {
      const shortcut: ShortcutConfig = { key: 's', ctrl: true, shift: true, action: vi.fn(), description: 'Save As' };
      expect(formatShortcut(shortcut)).toBe('Ctrl+Shift+S');
    });

    it('formats special keys', () => {
      expect(formatShortcut({ key: 'Space', action: vi.fn(), description: '' })).toBe('Space');
      expect(formatShortcut({ key: 'Escape', action: vi.fn(), description: '' })).toBe('Esc');
      expect(formatShortcut({ key: 'Enter', action: vi.fn(), description: '' })).toBe('Enter');
    });

    it('formats arrow keys', () => {
      expect(formatShortcut({ key: 'ArrowUp', action: vi.fn(), description: '' })).toBe('↑');
      expect(formatShortcut({ key: 'ArrowDown', action: vi.fn(), description: '' })).toBe('↓');
      expect(formatShortcut({ key: 'ArrowLeft', action: vi.fn(), description: '' })).toBe('←');
      expect(formatShortcut({ key: 'ArrowRight', action: vi.fn(), description: '' })).toBe('→');
    });
  });

  describe('Mac formatting', () => {
    beforeEach(() => {
      mockPlatform('MacIntel');
    });

    it('uses Mac symbols for Ctrl (⌘)', () => {
      const shortcut: ShortcutConfig = { key: 's', ctrl: true, action: vi.fn(), description: 'Save' };
      expect(formatShortcut(shortcut)).toBe('⌘S');
    });

    it('uses Mac symbols for Alt (⌥)', () => {
      const shortcut: ShortcutConfig = { key: 'n', alt: true, action: vi.fn(), description: 'New' };
      expect(formatShortcut(shortcut)).toBe('⌥N');
    });

    it('uses Mac symbols for Shift (⇧)', () => {
      const shortcut: ShortcutConfig = { key: 'p', shift: true, action: vi.fn(), description: 'Print' };
      expect(formatShortcut(shortcut)).toBe('⇧P');
    });

    it('combines Mac symbols without plus sign', () => {
      const shortcut: ShortcutConfig = { key: 's', ctrl: true, shift: true, action: vi.fn(), description: 'Save As' };
      expect(formatShortcut(shortcut)).toBe('⌘⇧S');
    });

    it('uses Mac symbols for special keys', () => {
      expect(formatShortcut({ key: 'Enter', action: vi.fn(), description: '' })).toBe('↩');
      expect(formatShortcut({ key: 'Backspace', action: vi.fn(), description: '' })).toBe('⌫');
      expect(formatShortcut({ key: 'Delete', action: vi.fn(), description: '' })).toBe('⌦');
      expect(formatShortcut({ key: 'Tab', action: vi.fn(), description: '' })).toBe('⇥');
    });
  });

  describe('useMacSymbols option', () => {
    beforeEach(() => {
      mockPlatform('MacIntel');
    });

    it('uses non-Mac format when useMacSymbols is false', () => {
      const shortcut: ShortcutConfig = { key: 's', ctrl: true, action: vi.fn(), description: 'Save' };
      expect(formatShortcut(shortcut, false)).toBe('Ctrl+S');
    });
  });
});
