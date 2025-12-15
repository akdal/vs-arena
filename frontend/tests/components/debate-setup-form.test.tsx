/**
 * Tests for DebateSetupForm component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { DebateSetupForm } from '@/components/debate/debate-setup-form';

// Mock hooks
const mockMutate = vi.fn();
vi.mock('@/hooks/use-debate', () => ({
  useStartDebate: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-agents', () => ({
  useAgents: () => ({
    data: [
      {
        agent_id: 'agent-1',
        name: 'Agent 1',
        model: 'llama3',
        persona_json: {},
        params_json: {},
      },
      {
        agent_id: 'agent-2',
        name: 'Agent 2',
        model: 'qwen2.5',
        persona_json: {},
        params_json: {},
      },
    ],
    isLoading: false,
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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

describe('DebateSetupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders topic textarea', () => {
    render(<DebateSetupForm />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/debate topic/i)).toBeInTheDocument();
  });

  it('renders agent selectors', () => {
    render(<DebateSetupForm />, { wrapper: createWrapper() });

    // Check for agent selection sections (using getAllBy since there are multiple)
    expect(screen.getByText('Agent A')).toBeInTheDocument();
    expect(screen.getByText('Agent B')).toBeInTheDocument();
    // Judge appears multiple times, so use getAllBy
    expect(screen.getAllByText(/judge/i).length).toBeGreaterThan(0);
  });

  it('renders position selectors', () => {
    render(<DebateSetupForm />, { wrapper: createWrapper() });

    // Position labels should be present (may appear multiple times)
    expect(screen.getAllByText(/position/i).length).toBeGreaterThan(0);
  });

  it('shows character count for topic', async () => {
    const user = userEvent.setup();
    render(<DebateSetupForm />, { wrapper: createWrapper() });

    const textarea = screen.getByLabelText(/debate topic/i);
    await user.type(textarea, 'Test topic');

    // Character count should update
    expect(screen.getByText(/10\/500/)).toBeInTheDocument();
  });

  it('has position selectors', () => {
    render(<DebateSetupForm />, { wrapper: createWrapper() });

    // Position selectors use combobox (Select component), not buttons
    const comboboxes = screen.getAllByRole('combobox');

    // Should have at least 4: 2 agent selectors + 2 position selectors
    expect(comboboxes.length).toBeGreaterThanOrEqual(4);

    // Check for position labels
    expect(screen.getAllByText(/position/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders submit button', () => {
    render(<DebateSetupForm />, { wrapper: createWrapper() });

    expect(
      screen.getByRole('button', { name: /start debate/i })
    ).toBeInTheDocument();
  });

  it('disables submit button when form is invalid', () => {
    render(<DebateSetupForm />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /start debate/i });
    expect(submitButton).toBeDisabled();
  });

  it('renders advanced configuration section', () => {
    render(<DebateSetupForm />, { wrapper: createWrapper() });

    // Advanced config section should exist
    expect(screen.getByText(/configuration/i)).toBeInTheDocument();
  });
});
