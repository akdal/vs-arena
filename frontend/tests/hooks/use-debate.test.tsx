/**
 * Tests for Debate hooks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useRuns,
  useRun,
  useRunTurns,
  useStartDebate,
  useDeleteRun,
  useCreateSwapTest,
  useSwapComparison,
} from '@/hooks/use-debate';
import * as apiClient from '@/lib/api-client';

// Mock api-client module
vi.mock('@/lib/api-client');

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Sample run data
const mockRun = {
  run_id: 'run-123',
  topic: 'AI will benefit humanity',
  position_a: 'FOR',
  position_b: 'AGAINST',
  agent_a_id: 'agent-1',
  agent_b_id: 'agent-2',
  agent_j_id: 'judge-1',
  config_json: { rounds: 3 },
  rubric_json: { argumentation_weight: 35 },
  result_json: null,
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  finished_at: null,
};

const mockRunDetail = {
  ...mockRun,
  agent_a: {
    agent_id: 'agent-1',
    name: 'Agent A',
    model: 'llama3',
    persona_json: {},
    params_json: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  agent_b: {
    agent_id: 'agent-2',
    name: 'Agent B',
    model: 'llama3',
    persona_json: {},
    params_json: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  agent_j: {
    agent_id: 'judge-1',
    name: 'Judge',
    model: 'llama3',
    persona_json: {},
    params_json: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

const mockTurns = [
  {
    turn_id: 'turn-1',
    run_id: 'run-123',
    agent_id: 'agent-1',
    phase: 'opening',
    role: 'agent_a',
    content: 'Opening argument from A',
    targets: [],
    metadata: { round: 1 },
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    turn_id: 'turn-2',
    run_id: 'run-123',
    agent_id: 'agent-2',
    phase: 'opening',
    role: 'agent_b',
    content: 'Opening argument from B',
    targets: [],
    metadata: { round: 1 },
    created_at: '2024-01-01T00:00:01Z',
  },
];

describe('useRuns', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches runs successfully', async () => {
    vi.mocked(apiClient.getRuns).mockResolvedValue([mockRun]);

    const { result } = renderHook(() => useRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(apiClient.getRuns).toHaveBeenCalledOnce();
  });

  it('returns empty array when no runs exist', async () => {
    vi.mocked(apiClient.getRuns).mockResolvedValue([]);

    const { result } = renderHook(() => useRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

describe('useRun', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches run by ID', async () => {
    vi.mocked(apiClient.getRun).mockResolvedValue(mockRunDetail);

    const { result } = renderHook(() => useRun('run-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.run_id).toBe('run-123');
    expect(apiClient.getRun).toHaveBeenCalledWith('run-123');
  });

  it('does not fetch when runId is null', () => {
    const { result } = renderHook(() => useRun(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(apiClient.getRun).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    vi.mocked(apiClient.getRun).mockRejectedValue(new Error('Run not found'));

    const { result } = renderHook(() => useRun('invalid-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Run not found');
  });
});

describe('useRunTurns', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches turns for run', async () => {
    vi.mocked(apiClient.getRunTurns).mockResolvedValue(mockTurns);

    const { result } = renderHook(() => useRunTurns('run-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].phase).toBe('opening');
    expect(result.current.data?.[0].role).toBe('agent_a');
    expect(apiClient.getRunTurns).toHaveBeenCalledWith('run-123');
  });

  it('does not fetch when runId is null', () => {
    const { result } = renderHook(() => useRunTurns(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(apiClient.getRunTurns).not.toHaveBeenCalled();
  });

  it('returns empty array when no turns exist', async () => {
    vi.mocked(apiClient.getRunTurns).mockResolvedValue([]);

    const { result } = renderHook(() => useRunTurns('run-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('handles fetch error', async () => {
    vi.mocked(apiClient.getRunTurns).mockRejectedValue(new Error('Run not found'));

    const { result } = renderHook(() => useRunTurns('invalid-run'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Run not found');
  });
});

describe('useStartDebate', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('starts debate with correct payload', async () => {
    const mockResponse = {
      run_id: 'run-456',
      status: 'pending',
      stream_url: '/api/debate/stream/run-456',
    };
    vi.mocked(apiClient.startDebate).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useStartDebate(), {
      wrapper: createWrapper(),
    });

    const debateData = {
      topic: 'AI Ethics',
      position_a: 'FOR' as const,
      position_b: 'AGAINST' as const,
      agent_a_id: 'agent-1',
      agent_b_id: 'agent-2',
      agent_j_id: 'judge-1',
    };

    const response = await result.current.mutateAsync(debateData);

    expect(response.run_id).toBe('run-456');
    expect(apiClient.startDebate).toHaveBeenCalledWith(debateData);
  });

  it('handles start debate error', async () => {
    vi.mocked(apiClient.startDebate).mockRejectedValue(
      new Error('Agent not found')
    );

    const { result } = renderHook(() => useStartDebate(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        topic: 'Test',
        position_a: 'FOR',
        position_b: 'AGAINST',
        agent_a_id: 'invalid',
        agent_b_id: 'invalid',
        agent_j_id: 'invalid',
      })
    ).rejects.toThrow('Agent not found');
  });
});

describe('useDeleteRun', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deletes run successfully', async () => {
    vi.mocked(apiClient.deleteRun).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRun(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('run-123');

    expect(apiClient.deleteRun).toHaveBeenCalledWith('run-123');
  });
});

describe('useCreateSwapTest', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates swap test successfully', async () => {
    const mockResponse = {
      run_id: 'swap-run-123',
      status: 'pending',
      stream_url: '/api/debate/stream/swap-run-123',
    };
    vi.mocked(apiClient.createSwapTest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateSwapTest(), {
      wrapper: createWrapper(),
    });

    const response = await result.current.mutateAsync('run-123');

    expect(response.run_id).toBe('swap-run-123');
    expect(apiClient.createSwapTest).toHaveBeenCalledWith('run-123');
  });

  it('handles swap test error for non-completed run', async () => {
    vi.mocked(apiClient.createSwapTest).mockRejectedValue(
      new Error('Can only create swap test from completed runs')
    );

    const { result } = renderHook(() => useCreateSwapTest(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync('pending-run')).rejects.toThrow(
      'completed'
    );
  });
});

describe('useSwapComparison', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches comparison when both IDs provided', async () => {
    const mockComparison = {
      original: {
        run_id: 'run-123',
        agent_a: mockRunDetail.agent_a,
        agent_b: mockRunDetail.agent_b,
        position_a: 'FOR',
        position_b: 'AGAINST',
        winner: 'A',
        scores_a: { total: 80 },
        scores_b: { total: 70 },
      },
      swapped: {
        run_id: 'swap-run',
        agent_a: mockRunDetail.agent_b,
        agent_b: mockRunDetail.agent_a,
        position_a: 'AGAINST',
        position_b: 'FOR',
        winner: 'B',
        scores_a: { total: 65 },
        scores_b: { total: 75 },
      },
      analysis: {
        bias_type: 'none' as const,
        biased_toward: null,
        description: 'No bias detected',
      },
    };
    vi.mocked(apiClient.getSwapComparison).mockResolvedValue(mockComparison);

    const { result } = renderHook(
      () => useSwapComparison('run-123', 'swap-run-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.analysis.bias_type).toBe('none');
    expect(apiClient.getSwapComparison).toHaveBeenCalledWith(
      'run-123',
      'swap-run-123'
    );
  });

  it('does not fetch when originalRunId is null', () => {
    const { result } = renderHook(
      () => useSwapComparison(null, 'swap-run-123'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.getSwapComparison).not.toHaveBeenCalled();
  });

  it('does not fetch when swapRunId is null', () => {
    const { result } = renderHook(() => useSwapComparison('run-123', null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.getSwapComparison).not.toHaveBeenCalled();
  });
});
