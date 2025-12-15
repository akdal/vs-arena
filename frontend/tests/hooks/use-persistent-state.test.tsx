/**
 * Tests for usePersistentState and usePersistentToggle hooks
 * localStorage persistence for React state
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersistentState, usePersistentToggle } from '@/hooks/use-persistent-state';

describe('usePersistentState', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns default value when localStorage is empty', () => {
      const { result } = renderHook(() => usePersistentState('test-key', 'default'));

      expect(result.current[0]).toBe('default');
    });

    it('returns stored value when localStorage has data', async () => {
      localStorage.setItem('test-key', JSON.stringify('stored-value'));

      const { result } = renderHook(() => usePersistentState('test-key', 'default'));

      // Wait for useEffect to load from localStorage
      await waitFor(() => {
        expect(result.current[0]).toBe('stored-value');
      });
    });

    it('handles different data types', async () => {
      // Number
      localStorage.setItem('number-key', JSON.stringify(42));
      const { result: numberResult } = renderHook(() => usePersistentState('number-key', 0));
      await waitFor(() => expect(numberResult.current[0]).toBe(42));

      // Boolean
      localStorage.setItem('bool-key', JSON.stringify(true));
      const { result: boolResult } = renderHook(() => usePersistentState('bool-key', false));
      await waitFor(() => expect(boolResult.current[0]).toBe(true));

      // Object
      localStorage.setItem('obj-key', JSON.stringify({ name: 'test' }));
      const { result: objResult } = renderHook(() => usePersistentState('obj-key', {}));
      await waitFor(() => expect(objResult.current[0]).toEqual({ name: 'test' }));

      // Array
      localStorage.setItem('arr-key', JSON.stringify([1, 2, 3]));
      const { result: arrResult } = renderHook(() => usePersistentState<number[]>('arr-key', []));
      await waitFor(() => expect(arrResult.current[0]).toEqual([1, 2, 3]));
    });
  });

  describe('state updates', () => {
    it('updates state when setValue is called', () => {
      const { result } = renderHook(() => usePersistentState('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
    });

    it('supports functional updates', () => {
      const { result } = renderHook(() => usePersistentState('test-key', 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1]((prev) => prev + 10);
      });

      expect(result.current[0]).toBe(11);
    });

    it('persists state to localStorage after update', async () => {
      const { result } = renderHook(() => usePersistentState('test-key', 'initial'));

      // Wait for initialization
      await waitFor(() => {
        expect(localStorage.getItem('test-key')).toBe(JSON.stringify('initial'));
      });

      act(() => {
        result.current[1]('updated');
      });

      await waitFor(() => {
        expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
      });
    });
  });

  describe('error handling', () => {
    it('uses default value when localStorage has invalid JSON', () => {
      localStorage.setItem('test-key', 'not-valid-json{');

      const { result } = renderHook(() => usePersistentState('test-key', 'default'));

      // Should use default value when JSON parse fails
      expect(result.current[0]).toBe('default');
    });

    it('handles localStorage unavailable on read', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() => usePersistentState('test-key', 'default'));

      expect(result.current[0]).toBe('default');

      localStorage.getItem = originalGetItem;
    });

    it('handles localStorage unavailable on write', async () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      const { result } = renderHook(() => usePersistentState('test-key', 'initial'));

      // Should not throw when localStorage write fails
      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');

      localStorage.setItem = originalSetItem;
    });
  });

  describe('key changes', () => {
    it('loads new value when key changes', async () => {
      localStorage.setItem('key-1', JSON.stringify('value-1'));
      localStorage.setItem('key-2', JSON.stringify('value-2'));

      const { result, rerender } = renderHook(
        ({ key }) => usePersistentState(key, 'default'),
        { initialProps: { key: 'key-1' } }
      );

      await waitFor(() => expect(result.current[0]).toBe('value-1'));

      rerender({ key: 'key-2' });

      await waitFor(() => expect(result.current[0]).toBe('value-2'));
    });
  });
});

describe('usePersistentToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns default boolean value', () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', true));

      expect(result.current[0]).toBe(true);
    });

    it('returns stored boolean value', async () => {
      localStorage.setItem('toggle-key', JSON.stringify(false));

      const { result } = renderHook(() => usePersistentToggle('toggle-key', true));

      await waitFor(() => {
        expect(result.current[0]).toBe(false);
      });
    });
  });

  describe('toggle function', () => {
    it('toggles from true to false', () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', true));

      act(() => {
        result.current[1](); // toggle function
      });

      expect(result.current[0]).toBe(false);
    });

    it('toggles from false to true', () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', false));

      act(() => {
        result.current[1](); // toggle function
      });

      expect(result.current[0]).toBe(true);
    });

    it('toggles multiple times', () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', false));

      act(() => result.current[1]());
      expect(result.current[0]).toBe(true);

      act(() => result.current[1]());
      expect(result.current[0]).toBe(false);

      act(() => result.current[1]());
      expect(result.current[0]).toBe(true);
    });
  });

  describe('setValue function', () => {
    it('sets value directly to true', () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', false));

      act(() => {
        result.current[2](true); // setValue function
      });

      expect(result.current[0]).toBe(true);
    });

    it('sets value directly to false', () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', true));

      act(() => {
        result.current[2](false); // setValue function
      });

      expect(result.current[0]).toBe(false);
    });
  });

  describe('persistence', () => {
    it('persists toggle to localStorage', async () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', false));

      // Wait for initialization
      await waitFor(() => {
        expect(localStorage.getItem('toggle-key')).toBe(JSON.stringify(false));
      });

      act(() => {
        result.current[1](); // toggle
      });

      await waitFor(() => {
        expect(localStorage.getItem('toggle-key')).toBe(JSON.stringify(true));
      });
    });

    it('persists setValue to localStorage', async () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', true));

      // Wait for initialization
      await waitFor(() => {
        expect(localStorage.getItem('toggle-key')).toBe(JSON.stringify(true));
      });

      act(() => {
        result.current[2](false); // setValue
      });

      await waitFor(() => {
        expect(localStorage.getItem('toggle-key')).toBe(JSON.stringify(false));
      });
    });
  });

  describe('return value types', () => {
    it('returns array with correct types', () => {
      const { result } = renderHook(() => usePersistentToggle('toggle-key', true));

      const [value, toggle, setValue] = result.current;

      expect(typeof value).toBe('boolean');
      expect(typeof toggle).toBe('function');
      expect(typeof setValue).toBe('function');
    });
  });
});
