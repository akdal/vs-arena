/**
 * Tests for Agent CRUD hooks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useAgents,
  useAgent,
  useCreateAgent,
  useDeleteAgent,
  useCloneAgent,
} from '@/hooks/use-agents';
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

// Sample agent data
const mockAgent = {
  agent_id: '123',
  name: 'Test Agent',
  model: 'llama3',
  persona_json: { role: 'debater' },
  params_json: { temperature: 0.7 },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAgents = [
  mockAgent,
  {
    ...mockAgent,
    agent_id: '456',
    name: 'Agent 2',
  },
];

describe('useAgents', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches agents successfully', async () => {
    vi.mocked(apiClient.getAgents).mockResolvedValue(mockAgents);

    const { result } = renderHook(() => useAgents(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAgents);
    expect(apiClient.getAgents).toHaveBeenCalledOnce();
  });

  it('handles fetch error', async () => {
    vi.mocked(apiClient.getAgents).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAgents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Network error');
  });

  it('returns empty array when no agents exist', async () => {
    vi.mocked(apiClient.getAgents).mockResolvedValue([]);

    const { result } = renderHook(() => useAgents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

describe('useAgent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches agent by ID', async () => {
    vi.mocked(apiClient.getAgent).mockResolvedValue(mockAgent);

    const { result } = renderHook(() => useAgent('123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAgent);
    expect(apiClient.getAgent).toHaveBeenCalledWith('123');
  });

  it('does not fetch when agentId is null', () => {
    const { result } = renderHook(() => useAgent(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(apiClient.getAgent).not.toHaveBeenCalled();
  });
});

describe('useCreateAgent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates agent successfully', async () => {
    const newAgent = { ...mockAgent, agent_id: '789', name: 'New Agent' };
    vi.mocked(apiClient.createAgent).mockResolvedValue(newAgent);

    const { result } = renderHook(() => useCreateAgent(), {
      wrapper: createWrapper(),
    });

    const agentData = {
      name: 'New Agent',
      model: 'llama3',
      persona_json: {},
      params_json: {},
    };

    await result.current.mutateAsync(agentData);

    expect(apiClient.createAgent).toHaveBeenCalledWith(agentData);
  });

  it('handles creation error', async () => {
    vi.mocked(apiClient.createAgent).mockRejectedValue(new Error('Creation failed'));

    const { result } = renderHook(() => useCreateAgent(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        name: 'New Agent',
        model: 'llama3',
        persona_json: {},
        params_json: {},
      })
    ).rejects.toThrow('Creation failed');
  });
});

describe('useDeleteAgent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deletes agent successfully', async () => {
    vi.mocked(apiClient.deleteAgent).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteAgent(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('123');

    expect(apiClient.deleteAgent).toHaveBeenCalledWith('123');
  });

  it('handles deletion error', async () => {
    vi.mocked(apiClient.deleteAgent).mockRejectedValue(new Error('Deletion failed'));

    const { result } = renderHook(() => useDeleteAgent(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync('123')).rejects.toThrow(
      'Deletion failed'
    );
  });
});

describe('useCloneAgent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('clones agent successfully', async () => {
    const clonedAgent = {
      ...mockAgent,
      agent_id: '999',
      name: 'Test Agent (Copy)',
    };
    vi.mocked(apiClient.cloneAgent).mockResolvedValue(clonedAgent);

    const { result } = renderHook(() => useCloneAgent(), {
      wrapper: createWrapper(),
    });

    const cloned = await result.current.mutateAsync('123');

    expect(apiClient.cloneAgent).toHaveBeenCalledWith('123');
    expect(cloned.name).toContain('(Copy)');
  });

  it('handles clone error', async () => {
    vi.mocked(apiClient.cloneAgent).mockRejectedValue(new Error('Clone failed'));

    const { result } = renderHook(() => useCloneAgent(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync('123')).rejects.toThrow(
      'Clone failed'
    );
  });
});
