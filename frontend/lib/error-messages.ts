/**
 * User-friendly error message utility
 * Maps technical errors to human-readable messages with recovery actions
 */

export type ErrorAction = "retry" | "reconnecting" | "contact" | "none";

export interface FriendlyError {
  title: string;
  description: string;
  action: ErrorAction;
  originalError: string;
}

interface ErrorMapping {
  title: string;
  description: string;
  action: ErrorAction;
}

const ERROR_MESSAGES: Record<string, ErrorMapping> = {
  ECONNREFUSED: {
    title: "Cannot connect to server",
    description: "The backend server is not responding. Please check if the server is running.",
    action: "retry",
  },
  NETWORK_ERROR: {
    title: "Network connection lost",
    description: "Please check your internet connection and try again.",
    action: "retry",
  },
  FETCH_ERROR: {
    title: "Request failed",
    description: "Could not complete the request. Please try again.",
    action: "retry",
  },
  TIMEOUT: {
    title: "Request timed out",
    description: "The server is taking too long to respond. This may be due to a slow LLM response.",
    action: "retry",
  },
  SSE_DISCONNECT: {
    title: "Stream disconnected",
    description: "The live debate stream was interrupted. Attempting to reconnect...",
    action: "reconnecting",
  },
  SSE_TIMEOUT: {
    title: "Connection timeout",
    description: "No data received for a while. Attempting to reconnect...",
    action: "reconnecting",
  },
  LLM_ERROR: {
    title: "AI model error",
    description: "The AI model encountered an issue. Please try again or use a different model.",
    action: "retry",
  },
  OLLAMA_ERROR: {
    title: "Ollama connection failed",
    description: "Could not connect to Ollama. Please ensure Ollama is running locally.",
    action: "retry",
  },
  RUN_FAILED: {
    title: "Debate failed",
    description: "This debate failed during execution. Please go back and start a new debate.",
    action: "none",
  },
  RUN_COMPLETED: {
    title: "Debate already finished",
    description: "This debate has already completed. You can view the results or replay.",
    action: "none",
  },
  RUN_IN_PROGRESS: {
    title: "Debate in progress",
    description: "This debate is already running in another session.",
    action: "none",
  },
  BAD_REQUEST: {
    title: "Invalid request",
    description: "The request was invalid. Please check your input and try again.",
    action: "none",
  },
  NOT_FOUND: {
    title: "Not found",
    description: "The requested resource could not be found.",
    action: "none",
  },
  UNAUTHORIZED: {
    title: "Unauthorized",
    description: "You don't have permission to perform this action.",
    action: "none",
  },
  SERVER_ERROR: {
    title: "Server error",
    description: "Something went wrong on our end. Please try again later.",
    action: "retry",
  },
  DEFAULT: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    action: "retry",
  },
};

/**
 * Convert technical error to user-friendly message
 */
export function getUserFriendlyError(error: string | Error): FriendlyError {
  const errorString = error instanceof Error ? error.message : error;

  // Handle empty or whitespace-only error strings
  if (!errorString || errorString.trim() === "") {
    return { ...ERROR_MESSAGES.DEFAULT, originalError: "Unknown error (no message provided)" };
  }

  const lowerError = errorString.toLowerCase();

  // Match against known patterns
  if (lowerError.includes("econnrefused") || lowerError.includes("connection refused")) {
    return { ...ERROR_MESSAGES.ECONNREFUSED, originalError: errorString };
  }

  if (lowerError.includes("networkerror") || lowerError.includes("network error")) {
    return { ...ERROR_MESSAGES.NETWORK_ERROR, originalError: errorString };
  }

  if (lowerError.includes("failed to fetch") || lowerError.includes("fetch failed")) {
    return { ...ERROR_MESSAGES.FETCH_ERROR, originalError: errorString };
  }

  if (lowerError.includes("timeout") || lowerError.includes("timed out")) {
    return { ...ERROR_MESSAGES.TIMEOUT, originalError: errorString };
  }

  if (lowerError.includes("connection lost") || lowerError.includes("reconnect")) {
    return { ...ERROR_MESSAGES.SSE_DISCONNECT, originalError: errorString };
  }

  if (lowerError.includes("sse") || lowerError.includes("stream")) {
    return { ...ERROR_MESSAGES.SSE_DISCONNECT, originalError: errorString };
  }

  if (lowerError.includes("llm") || lowerError.includes("model error")) {
    return { ...ERROR_MESSAGES.LLM_ERROR, originalError: errorString };
  }

  if (lowerError.includes("ollama")) {
    return { ...ERROR_MESSAGES.OLLAMA_ERROR, originalError: errorString };
  }

  // Run status errors (check before generic 400)
  if (lowerError.includes("run previously failed") || lowerError.includes("run failed")) {
    return { ...ERROR_MESSAGES.RUN_FAILED, originalError: errorString };
  }

  if (lowerError.includes("run already completed") || lowerError.includes("already completed")) {
    return { ...ERROR_MESSAGES.RUN_COMPLETED, originalError: errorString };
  }

  if (lowerError.includes("run already in progress") || lowerError.includes("already in progress")) {
    return { ...ERROR_MESSAGES.RUN_IN_PROGRESS, originalError: errorString };
  }

  if (lowerError.includes("400") || lowerError.includes("bad request")) {
    return { ...ERROR_MESSAGES.BAD_REQUEST, originalError: errorString };
  }

  if (lowerError.includes("404") || lowerError.includes("not found")) {
    return { ...ERROR_MESSAGES.NOT_FOUND, originalError: errorString };
  }

  if (lowerError.includes("401") || lowerError.includes("unauthorized")) {
    return { ...ERROR_MESSAGES.UNAUTHORIZED, originalError: errorString };
  }

  if (lowerError.includes("500") || lowerError.includes("internal server")) {
    return { ...ERROR_MESSAGES.SERVER_ERROR, originalError: errorString };
  }

  // HTTP status code patterns
  const httpMatch = errorString.match(/HTTP (\d{3})/i);
  if (httpMatch) {
    const status = parseInt(httpMatch[1], 10);
    if (status === 400) return { ...ERROR_MESSAGES.BAD_REQUEST, originalError: errorString };
    if (status === 404) return { ...ERROR_MESSAGES.NOT_FOUND, originalError: errorString };
    if (status === 401 || status === 403) return { ...ERROR_MESSAGES.UNAUTHORIZED, originalError: errorString };
    if (status >= 500) return { ...ERROR_MESSAGES.SERVER_ERROR, originalError: errorString };
  }

  return { ...ERROR_MESSAGES.DEFAULT, originalError: errorString };
}

/**
 * Get error message for SSE reconnection state
 */
export function getReconnectingError(attempt: number, maxAttempts: number): FriendlyError {
  return {
    title: "Reconnecting...",
    description: `Attempt ${attempt} of ${maxAttempts}. Please wait...`,
    action: "reconnecting",
    originalError: `SSE reconnection attempt ${attempt}/${maxAttempts}`,
  };
}

/**
 * Get error message for max reconnection attempts exceeded
 */
export function getMaxReconnectsError(): FriendlyError {
  return {
    title: "Connection lost",
    description: "Could not reconnect after multiple attempts. Please refresh the page.",
    action: "retry",
    originalError: "Max reconnection attempts exceeded",
  };
}

/**
 * Permanent error patterns that should NOT trigger reconnection
 * These are errors where retrying won't help - the state is final
 */
const PERMANENT_ERROR_PATTERNS = [
  "run previously failed",
  "run already completed",
  "run already in progress",
  "already running in another session",
  "not found",
  "unauthorized",
  "bad request",
  "invalid",
  "http 400",
  "http 401",
  "http 403",
  "http 404",
  "http 409",
];

/**
 * Check if an error is permanent (should not attempt reconnection)
 */
export function isPermanentError(error: string | Error): boolean {
  const errorString = error instanceof Error ? error.message : error;
  if (!errorString) return false;

  const lowerError = errorString.toLowerCase();
  return PERMANENT_ERROR_PATTERNS.some((pattern) => lowerError.includes(pattern));
}
