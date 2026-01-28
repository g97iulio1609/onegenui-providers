/**
 * Set up abort signal handling for Gemini requests
 * Note: gemini-cli-core doesn't expose request cancellation,
 * so we can only check abort status before/after requests
 */
export function setupAbortHandler(signal: AbortSignal | undefined): {
  listener?: () => void;
  checkAborted: () => void;
} {
  if (!signal) {
    return { checkAborted: () => {} };
  }

  // Check if already aborted
  if (signal.aborted) {
    const abortError = new Error("Request aborted");
    abortError.name = "AbortError";
    throw abortError;
  }

  let listener: (() => void) | undefined;
  listener = () => {
    // Track abort state - actual cancellation happens via status checks
  };
  signal.addEventListener("abort", listener, { once: true });

  const checkAborted = () => {
    if (signal.aborted) {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";
      throw abortError;
    }
  };

  return { listener, checkAborted };
}

/**
 * Clean up abort listener
 */
export function cleanupAbortHandler(
  signal: AbortSignal | undefined,
  listener: (() => void) | undefined,
): void {
  if (signal && listener) {
    signal.removeEventListener("abort", listener);
  }
}
