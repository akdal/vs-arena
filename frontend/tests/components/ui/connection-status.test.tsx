/**
 * Tests for ConnectionStatus and StreamingIndicator components
 * Real-time connection state display
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus, StreamingIndicator } from '@/components/ui/connection-status';

describe('ConnectionStatus', () => {
  const defaultProps = {
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    maxAttempts: 3,
  };

  describe('rendering conditions', () => {
    it('renders null when not reconnecting', () => {
      const { container } = render(
        <ConnectionStatus {...defaultProps} isReconnecting={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders null when connected and not reconnecting', () => {
      const { container } = render(
        <ConnectionStatus
          {...defaultProps}
          isConnected={true}
          isReconnecting={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when reconnecting', () => {
      render(
        <ConnectionStatus
          {...defaultProps}
          isReconnecting={true}
          reconnectAttempts={1}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('reconnecting state', () => {
    it('shows reconnecting message with attempt count', () => {
      render(
        <ConnectionStatus
          {...defaultProps}
          isReconnecting={true}
          reconnectAttempts={1}
          maxAttempts={3}
        />
      );

      expect(screen.getByText(/Reconnecting/)).toBeInTheDocument();
      expect(screen.getByText(/1\/3/)).toBeInTheDocument();
    });

    it('updates attempt count', () => {
      const { rerender } = render(
        <ConnectionStatus
          {...defaultProps}
          isReconnecting={true}
          reconnectAttempts={1}
          maxAttempts={3}
        />
      );

      expect(screen.getByText(/1\/3/)).toBeInTheDocument();

      rerender(
        <ConnectionStatus
          {...defaultProps}
          isReconnecting={true}
          reconnectAttempts={2}
          maxAttempts={3}
        />
      );

      expect(screen.getByText(/2\/3/)).toBeInTheDocument();
    });

    it('shows final attempt correctly', () => {
      render(
        <ConnectionStatus
          {...defaultProps}
          isReconnecting={true}
          reconnectAttempts={3}
          maxAttempts={3}
        />
      );

      expect(screen.getByText(/3\/3/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(
        <ConnectionStatus
          {...defaultProps}
          isReconnecting={true}
          reconnectAttempts={1}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(
        <ConnectionStatus
          {...defaultProps}
          isReconnecting={true}
          reconnectAttempts={1}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(
        <ConnectionStatus
          {...defaultProps}
          isReconnecting={true}
          reconnectAttempts={1}
          className="custom-class"
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveClass('custom-class');
    });
  });
});

describe('StreamingIndicator', () => {
  describe('rendering conditions', () => {
    it('renders null when not streaming', () => {
      const { container } = render(
        <StreamingIndicator isStreaming={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when streaming', () => {
      render(<StreamingIndicator isStreaming={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows "Streaming..." when no phase', () => {
      render(<StreamingIndicator isStreaming={true} />);

      expect(screen.getByText('Streaming...')).toBeInTheDocument();
    });

    it('shows phase name when provided', () => {
      render(
        <StreamingIndicator isStreaming={true} currentPhase="opening_a" />
      );

      expect(screen.getByText(/Streaming:/)).toBeInTheDocument();
      expect(screen.getByText(/Opening A/)).toBeInTheDocument();
    });

    it('formats phase name correctly', () => {
      render(
        <StreamingIndicator isStreaming={true} currentPhase="rebuttal_b" />
      );

      expect(screen.getByText(/Rebuttal B/)).toBeInTheDocument();
    });

    it('handles complex phase names', () => {
      render(
        <StreamingIndicator isStreaming={true} currentPhase="cross_examination" />
      );

      expect(screen.getByText(/Cross Examination/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<StreamingIndicator isStreaming={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(<StreamingIndicator isStreaming={true} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(
        <StreamingIndicator isStreaming={true} className="custom-class" />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveClass('custom-class');
    });
  });
});
