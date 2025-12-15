/**
 * Tests for useDebateReplay hook
 * Debate replay functionality with playback controls
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebateReplay } from '@/hooks/use-debate-replay';
import type { RunDetail, Turn, DebatePhase } from '@/lib/types';

// Mock @xyflow/react with actual useState to maintain state
vi.mock('@xyflow/react', async () => {
  const { useState, useCallback } = await import('react');
  return {
    useNodesState: <T,>(initialNodes: T[]) => {
      const [nodes, setNodesInternal] = useState<T[]>(initialNodes);
      const setNodes = useCallback((updater: T[] | ((prev: T[]) => T[])) => {
        if (typeof updater === 'function') {
          setNodesInternal(updater);
        } else {
          setNodesInternal(updater);
        }
      }, []);
      const onNodesChange = useCallback(() => {}, []);
      return [nodes, setNodes, onNodesChange] as const;
    },
    useEdgesState: <T,>(initialEdges: T[]) => {
      const [edges, setEdgesInternal] = useState<T[]>(initialEdges);
      const setEdges = useCallback((updater: T[] | ((prev: T[]) => T[])) => {
        if (typeof updater === 'function') {
          setEdgesInternal(updater);
        } else {
          setEdgesInternal(updater);
        }
      }, []);
      const onEdgesChange = useCallback(() => {}, []);
      return [edges, setEdges, onEdgesChange] as const;
    },
  };
});

// Mock flow utilities
vi.mock('@/components/flow/utils/node-factory', () => ({
  createInitialNodes: vi.fn(() => [{ id: 'topic', type: 'topic', position: { x: 0, y: 0 }, data: {} }]),
  createPhaseNode: vi.fn((phase: string) => ({
    id: phase,
    type: 'argument',
    position: { x: 0, y: 0 },
    data: { content: '', isStreaming: false, isComplete: false },
  })),
  createSequenceEdges: vi.fn(() => []),
}));

vi.mock('@/components/flow/utils/layout', () => ({
  getLayoutedElements: vi.fn((nodes, edges) => ({ nodes, edges })),
}));

// Sample test data
const mockRun: RunDetail = {
  run_id: 'test-run-1',
  topic: 'Test Topic',
  agent_a_id: 'agent-a',
  agent_b_id: 'agent-b',
  status: 'completed',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockTurns: Turn[] = [
  {
    turn_id: 't1',
    run_id: 'test-run-1',
    phase: 'opening_a' as DebatePhase,
    content: 'Opening argument A',
    metadata_json: {},
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    turn_id: 't2',
    run_id: 'test-run-1',
    phase: 'opening_b' as DebatePhase,
    content: 'Opening argument B',
    metadata_json: {},
    created_at: '2024-01-01T00:01:00Z',
  },
  {
    turn_id: 't3',
    run_id: 'test-run-1',
    phase: 'rebuttal_a' as DebatePhase,
    content: 'Rebuttal A',
    metadata_json: {},
    created_at: '2024-01-01T00:02:00Z',
  },
];

describe('useDebateReplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with playback paused', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(result.current.isPlaying).toBe(false);
    });

    it('starts with phase index at -1 (not started)', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(result.current.currentPhaseIndex).toBe(-1);
    });

    it('starts with null currentPhase', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(result.current.currentPhase).toBeNull();
    });

    it('starts with isComplete false', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(result.current.isComplete).toBe(false);
    });

    it('starts with progress at 0', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(result.current.progress).toBe(0);
    });

    it('starts with speed at 1x', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(result.current.speed).toBe(1);
    });

    it('calculates totalPhases from turns', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(result.current.totalPhases).toBe(3);
    });

    it('shows Ready as current phase label when not started', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(result.current.currentPhaseLabel).toBe('Ready');
    });
  });

  describe('play/pause controls', () => {
    it('play() sets isPlaying to true', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('pause() sets isPlaying to false', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.play();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('togglePlayPause() toggles isPlaying', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      // Start paused
      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.togglePlayPause();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlayPause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('play() starts from first phase', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.play();
      });

      expect(result.current.currentPhaseIndex).toBe(0);
    });
  });

  describe('speed control', () => {
    it('setSpeed() updates speed', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.setSpeed(2);
      });

      expect(result.current.speed).toBe(2);
    });

    it('allows 0.5x speed', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.setSpeed(0.5);
      });

      expect(result.current.speed).toBe(0.5);
    });

    it('allows 4x speed', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.setSpeed(4);
      });

      expect(result.current.speed).toBe(4);
    });
  });

  describe('phase navigation', () => {
    it('goToPhase() sets currentPhaseIndex', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.goToPhase(1);
      });

      expect(result.current.currentPhaseIndex).toBe(1);
    });

    it('goToPhase() pauses playback', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.play();
      });

      act(() => {
        result.current.goToPhase(1);
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('goToPhase() ignores invalid index (negative)', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.goToPhase(-1);
      });

      expect(result.current.currentPhaseIndex).toBe(-1);
    });

    it('goToPhase() ignores invalid index (too large)', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.goToPhase(100);
      });

      expect(result.current.currentPhaseIndex).toBe(-1);
    });

    it('nextPhase() moves to next phase', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.play();
      });

      act(() => {
        result.current.nextPhase();
      });

      expect(result.current.currentPhaseIndex).toBe(1);
    });

    it('previousPhase() moves to previous phase', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.goToPhase(2);
      });

      act(() => {
        result.current.previousPhase();
      });

      expect(result.current.currentPhaseIndex).toBe(1);
    });

    it('previousPhase() at index 0 resets', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.play();
      });

      expect(result.current.currentPhaseIndex).toBe(0);

      act(() => {
        result.current.previousPhase();
      });

      expect(result.current.currentPhaseIndex).toBe(-1);
    });
  });

  describe('reset', () => {
    it('reset() returns to initial state', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.play();
        result.current.goToPhase(2);
        result.current.setSpeed(2);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentPhaseIndex).toBe(-1);
      expect(result.current.isComplete).toBe(false);
    });

    it('reset() preserves speed setting', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      act(() => {
        result.current.setSpeed(2);
      });

      act(() => {
        result.current.reset();
      });

      // Speed is not reset
      expect(result.current.speed).toBe(2);
    });
  });

  describe('empty turns', () => {
    it('handles empty turns array', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: [] })
      );

      expect(result.current.totalPhases).toBe(0);
      expect(result.current.progress).toBe(0);
    });

    it('play() does nothing with empty turns', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: [] })
      );

      act(() => {
        result.current.play();
      });

      // Should still be playing but with no phases
      expect(result.current.currentPhaseIndex).toBe(-1);
    });
  });

  describe('return value structure', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      // React Flow state
      expect(result.current).toHaveProperty('nodes');
      expect(result.current).toHaveProperty('edges');
      expect(result.current).toHaveProperty('onNodesChange');
      expect(result.current).toHaveProperty('onEdgesChange');

      // Playback state
      expect(result.current).toHaveProperty('isPlaying');
      expect(result.current).toHaveProperty('speed');
      expect(result.current).toHaveProperty('currentPhase');
      expect(result.current).toHaveProperty('currentPhaseIndex');
      expect(result.current).toHaveProperty('totalPhases');
      expect(result.current).toHaveProperty('progress');
      expect(result.current).toHaveProperty('isComplete');
      expect(result.current).toHaveProperty('currentPhaseLabel');

      // Controls
      expect(result.current).toHaveProperty('play');
      expect(result.current).toHaveProperty('pause');
      expect(result.current).toHaveProperty('togglePlayPause');
      expect(result.current).toHaveProperty('setSpeed');
      expect(result.current).toHaveProperty('goToPhase');
      expect(result.current).toHaveProperty('nextPhase');
      expect(result.current).toHaveProperty('previousPhase');
      expect(result.current).toHaveProperty('reset');
    });

    it('control functions are callable', () => {
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns })
      );

      expect(typeof result.current.play).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.togglePlayPause).toBe('function');
      expect(typeof result.current.setSpeed).toBe('function');
      expect(typeof result.current.goToPhase).toBe('function');
      expect(typeof result.current.nextPhase).toBe('function');
      expect(typeof result.current.previousPhase).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('callbacks', () => {
    it('calls onLayoutChange when provided', () => {
      const onLayoutChange = vi.fn();
      const { result } = renderHook(() =>
        useDebateReplay({ run: mockRun, turns: mockTurns, onLayoutChange })
      );

      act(() => {
        result.current.reset();
      });

      expect(onLayoutChange).toHaveBeenCalled();
    });
  });
});
