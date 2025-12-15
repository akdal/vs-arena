"use client";

/**
 * Persistent State Hook
 * Syncs state with localStorage for persistence across page reloads
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Hook to persist state in localStorage
 *
 * @param key - The localStorage key to use
 * @param defaultValue - The default value if no stored value exists
 * @returns [value, setValue] - State value and setter function
 *
 * @example
 * ```tsx
 * const [isPanelOpen, setIsPanelOpen] = usePersistentState("panel-open", true);
 * ```
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with default value
  const [state, setState] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        setState(JSON.parse(storedValue) as T);
      }
    } catch {
      // localStorage unavailable or parse error - use default
    }
    setIsInitialized(true);
  }, [key]);

  // Persist to localStorage when state changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private browsing, quota exceeded) - silently ignore
    }
  }, [key, state, isInitialized]);

  // Wrapper to handle functional updates
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(value);
  }, []);

  return [state, setValue];
}

/**
 * Hook for boolean toggle state with localStorage persistence
 *
 * @param key - The localStorage key to use
 * @param defaultValue - The default boolean value
 * @returns [value, toggle, setValue] - State, toggle function, and setter
 *
 * @example
 * ```tsx
 * const [isOpen, toggleOpen, setIsOpen] = usePersistentToggle("panel-open", true);
 * // toggleOpen() - toggles the state
 * // setIsOpen(false) - sets explicitly
 * ```
 */
export function usePersistentToggle(
  key: string,
  defaultValue: boolean
): [boolean, () => void, (value: boolean) => void] {
  const [state, setState] = usePersistentState(key, defaultValue);

  const toggle = useCallback(() => {
    setState((prev) => !prev);
  }, [setState]);

  return [state, toggle, setState];
}
