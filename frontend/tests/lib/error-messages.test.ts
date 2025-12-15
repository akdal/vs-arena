/**
 * Tests for error-messages utility
 * User-friendly error message conversion and formatting
 */
import { describe, it, expect } from 'vitest';
import {
  getUserFriendlyError,
  getReconnectingError,
  getMaxReconnectsError,
  type FriendlyError,
} from '@/lib/error-messages';

describe('getUserFriendlyError', () => {
  describe('connection errors', () => {
    it('handles ECONNREFUSED error', () => {
      const result = getUserFriendlyError('connect ECONNREFUSED 127.0.0.1:8000');

      expect(result.title).toBe('Cannot connect to server');
      expect(result.action).toBe('retry');
      expect(result.originalError).toContain('ECONNREFUSED');
    });

    it('handles connection refused (case insensitive)', () => {
      const result = getUserFriendlyError('Connection Refused by server');

      expect(result.title).toBe('Cannot connect to server');
      expect(result.action).toBe('retry');
    });

    it('handles network error', () => {
      const result = getUserFriendlyError('NetworkError when attempting to fetch');

      expect(result.title).toBe('Network connection lost');
      expect(result.action).toBe('retry');
    });

    it('handles network error with space', () => {
      const result = getUserFriendlyError('A network error occurred');

      expect(result.title).toBe('Network connection lost');
    });
  });

  describe('fetch errors', () => {
    it('handles failed to fetch', () => {
      const result = getUserFriendlyError('Failed to fetch');

      expect(result.title).toBe('Request failed');
      expect(result.action).toBe('retry');
    });

    it('handles fetch failed', () => {
      const result = getUserFriendlyError('Fetch failed: TypeError');

      expect(result.title).toBe('Request failed');
    });
  });

  describe('timeout errors', () => {
    it('handles timeout keyword', () => {
      const result = getUserFriendlyError('Request timeout after 30000ms');

      expect(result.title).toBe('Request timed out');
      expect(result.action).toBe('retry');
    });

    it('handles timed out keyword', () => {
      const result = getUserFriendlyError('The operation timed out');

      expect(result.title).toBe('Request timed out');
    });
  });

  describe('SSE/streaming errors', () => {
    it('handles connection lost', () => {
      const result = getUserFriendlyError('SSE connection lost');

      expect(result.title).toBe('Stream disconnected');
      expect(result.action).toBe('reconnecting');
    });

    it('handles reconnect keyword', () => {
      const result = getUserFriendlyError('Failed to reconnect to stream');

      expect(result.title).toBe('Stream disconnected');
      expect(result.action).toBe('reconnecting');
    });

    it('handles SSE keyword', () => {
      const result = getUserFriendlyError('SSE error occurred');

      expect(result.title).toBe('Stream disconnected');
    });

    it('handles stream keyword', () => {
      const result = getUserFriendlyError('Stream interrupted unexpectedly');

      expect(result.title).toBe('Stream disconnected');
    });
  });

  describe('LLM/Ollama errors', () => {
    it('handles LLM error', () => {
      const result = getUserFriendlyError('LLM generation failed');

      expect(result.title).toBe('AI model error');
      expect(result.action).toBe('retry');
    });

    it('handles model error', () => {
      const result = getUserFriendlyError('Model error: out of memory');

      expect(result.title).toBe('AI model error');
    });

    it('handles Ollama error', () => {
      const result = getUserFriendlyError('Ollama server not responding');

      expect(result.title).toBe('Ollama connection failed');
      expect(result.action).toBe('retry');
    });
  });

  describe('HTTP status errors', () => {
    it('handles 400 bad request', () => {
      const result = getUserFriendlyError('Error 400: bad request');

      expect(result.title).toBe('Invalid request');
      expect(result.action).toBe('none');
    });

    it('handles bad request text', () => {
      const result = getUserFriendlyError('Bad Request - invalid JSON');

      expect(result.title).toBe('Invalid request');
    });

    it('handles 401 unauthorized', () => {
      const result = getUserFriendlyError('HTTP 401 Unauthorized');

      expect(result.title).toBe('Unauthorized');
      expect(result.action).toBe('none');
    });

    it('handles 403 via HTTP pattern', () => {
      const result = getUserFriendlyError('HTTP 403 Forbidden');

      expect(result.title).toBe('Unauthorized');
    });

    it('handles 404 not found', () => {
      const result = getUserFriendlyError('Resource 404 not found');

      expect(result.title).toBe('Not found');
      expect(result.action).toBe('none');
    });

    it('handles not found text', () => {
      const result = getUserFriendlyError('Agent not found');

      expect(result.title).toBe('Not found');
    });

    it('handles 500 server error', () => {
      const result = getUserFriendlyError('HTTP 500 Internal Server Error');

      expect(result.title).toBe('Server error');
      expect(result.action).toBe('retry');
    });

    it('handles internal server text', () => {
      const result = getUserFriendlyError('Internal Server Error occurred');

      expect(result.title).toBe('Server error');
    });

    it('handles 502 via HTTP pattern', () => {
      const result = getUserFriendlyError('HTTP 502 Bad Gateway');

      expect(result.title).toBe('Server error');
    });

    it('handles 503 via HTTP pattern', () => {
      const result = getUserFriendlyError('HTTP 503 Service Unavailable');

      expect(result.title).toBe('Server error');
    });
  });

  describe('edge cases', () => {
    it('handles Error object', () => {
      const error = new Error('Connection refused');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Cannot connect to server');
      expect(result.originalError).toBe('Connection refused');
    });

    it('handles empty string', () => {
      const result = getUserFriendlyError('');

      expect(result.title).toBe('Something went wrong');
      expect(result.originalError).toContain('Unknown error');
    });

    it('handles whitespace-only string', () => {
      const result = getUserFriendlyError('   ');

      expect(result.title).toBe('Something went wrong');
    });

    it('handles unknown error', () => {
      const result = getUserFriendlyError('Some random error xyz');

      expect(result.title).toBe('Something went wrong');
      expect(result.action).toBe('retry');
      expect(result.originalError).toBe('Some random error xyz');
    });

    it('preserves original error string', () => {
      const originalError = 'ECONNREFUSED 127.0.0.1:8000 - detailed info';
      const result = getUserFriendlyError(originalError);

      expect(result.originalError).toBe(originalError);
    });
  });
});

describe('getReconnectingError', () => {
  it('formats attempt 1 of 3', () => {
    const result = getReconnectingError(1, 3);

    expect(result.title).toBe('Reconnecting...');
    expect(result.description).toBe('Attempt 1 of 3. Please wait...');
    expect(result.action).toBe('reconnecting');
  });

  it('formats attempt 2 of 5', () => {
    const result = getReconnectingError(2, 5);

    expect(result.description).toBe('Attempt 2 of 5. Please wait...');
  });

  it('formats final attempt', () => {
    const result = getReconnectingError(3, 3);

    expect(result.description).toBe('Attempt 3 of 3. Please wait...');
  });

  it('includes attempt info in originalError', () => {
    const result = getReconnectingError(2, 3);

    expect(result.originalError).toContain('2/3');
  });
});

describe('getMaxReconnectsError', () => {
  it('returns connection lost error', () => {
    const result = getMaxReconnectsError();

    expect(result.title).toBe('Connection lost');
    expect(result.description).toContain('Could not reconnect');
    expect(result.description).toContain('refresh the page');
    expect(result.action).toBe('retry');
  });

  it('includes max attempts in originalError', () => {
    const result = getMaxReconnectsError();

    expect(result.originalError).toContain('Max reconnection attempts');
  });
});

describe('FriendlyError structure', () => {
  it('always returns required fields', () => {
    const testCases = [
      'ECONNREFUSED',
      'Network error',
      'timeout',
      'unknown error',
      '',
    ];

    testCases.forEach((errorStr) => {
      const result = getUserFriendlyError(errorStr);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('originalError');
      expect(typeof result.title).toBe('string');
      expect(typeof result.description).toBe('string');
      expect(['retry', 'reconnecting', 'contact', 'none']).toContain(result.action);
    });
  });
});
