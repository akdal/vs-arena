/**
 * Tests for AgentCard component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AgentCard } from '@/components/agent/agent-card';

// Mock hooks
vi.mock('@/hooks/use-agents', () => ({
  useCloneAgent: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useDeleteAgent: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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

const mockAgent = {
  agent_id: '123',
  name: 'Test Agent',
  model: 'llama3',
  persona_json: { role: 'debater', style: 'analytical' },
  params_json: { temperature: 0.8, max_tokens: 2048 },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('AgentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders agent name and model', () => {
    render(<AgentCard agent={mockAgent} />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('llama3')).toBeInTheDocument();
  });

  it('displays persona information', () => {
    render(<AgentCard agent={mockAgent} />, { wrapper: createWrapper() });

    expect(screen.getByText(/role:/i)).toBeInTheDocument();
    expect(screen.getByText(/debater/)).toBeInTheDocument();
    expect(screen.getByText(/style:/i)).toBeInTheDocument();
    expect(screen.getByText(/analytical/)).toBeInTheDocument();
  });

  it('displays parameters', () => {
    render(<AgentCard agent={mockAgent} />, { wrapper: createWrapper() });

    expect(screen.getByText(/Temp: 0.8/)).toBeInTheDocument();
    expect(screen.getByText(/Tokens: 2048/)).toBeInTheDocument();
  });

  it('displays default parameters when not set', () => {
    const agentWithoutParams = {
      ...mockAgent,
      params_json: {},
    };

    render(<AgentCard agent={agentWithoutParams} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Temp: 0.7/)).toBeInTheDocument();
    expect(screen.getByText(/Tokens: 1024/)).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(<AgentCard agent={mockAgent} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clone/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('navigates to edit page on Edit click', async () => {
    const user = userEvent.setup();
    render(<AgentCard agent={mockAgent} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(mockPush).toHaveBeenCalledWith('/agent/123/edit');
  });

  it('shows delete confirmation on first Delete click', async () => {
    const user = userEvent.setup();
    render(<AgentCard agent={mockAgent} />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /confirm delete/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('hides confirmation on Cancel click', async () => {
    const user = userEvent.setup();
    render(<AgentCard agent={mockAgent} />, { wrapper: createWrapper() });

    // First click shows confirmation
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    // Cancel click hides confirmation
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it('handles empty persona gracefully', () => {
    const agentWithEmptyPersona = {
      ...mockAgent,
      persona_json: {},
    };

    render(<AgentCard agent={agentWithEmptyPersona} />, {
      wrapper: createWrapper(),
    });

    // Should still render without error
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Persona')).toBeInTheDocument();
  });
});
