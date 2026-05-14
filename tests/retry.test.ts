import { describe, it, expect, vi } from "vitest";
import { withRetry, isRetryable, getDelay, DEFAULT_RETRY_OPTIONS } from "../src/retry.js";

describe("isRetryable", () => {
  it("identifies 429 errors as retryable", () => {
    expect(isRetryable(new Error("Request failed with 429"))).toBe(true);
  });

  it("identifies rate limit errors as retryable", () => {
    expect(isRetryable(new Error("rate limit exceeded"))).toBe(true);
  });

  it("identifies quota errors as retryable", () => {
    expect(isRetryable(new Error("Resource exhausted: quota"))).toBe(true);
  });

  it("identifies 500 errors as retryable", () => {
    expect(isRetryable(new Error("Internal server error 500"))).toBe(true);
  });

  it("identifies 503 errors as retryable", () => {
    expect(isRetryable(new Error("Service unavailable 503"))).toBe(true);
  });

  it("identifies network errors as retryable", () => {
    expect(isRetryable(new Error("network error"))).toBe(true);
  });

  it("identifies ECONNREFUSED as retryable", () => {
    expect(isRetryable(new Error("connect ECONNREFUSED 10.0.0.1:443"))).toBe(true);
  });

  it("identifies ECONNRESET as retryable", () => {
    expect(isRetryable(new Error("read ECONNRESET"))).toBe(true);
  });

  it("identifies timeout errors as retryable", () => {
    expect(isRetryable(new Error("request timeout"))).toBe(true);
  });

  it("identifies socket hang up as retryable", () => {
    expect(isRetryable(new Error("socket hang up"))).toBe(true);
  });

  it("does NOT retry 403 errors", () => {
    expect(isRetryable(new Error("403 Forbidden"))).toBe(false);
  });

  it("does NOT retry 404 errors", () => {
    expect(isRetryable(new Error("404 Not Found"))).toBe(false);
  });

  it("does NOT retry API key errors", () => {
    expect(isRetryable(new Error("invalid api key"))).toBe(false);
  });

  it("does NOT retry non-Error values", () => {
    expect(isRetryable("string error")).toBe(false);
    expect(isRetryable(42)).toBe(false);
    expect(isRetryable(null)).toBe(false);
  });
});

describe("getDelay", () => {
  it("returns base delay for attempt 0", () => {
    const delay = getDelay(0, 1000, 10000);
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThan(2000);
  });

  it("doubles delay for attempt 1", () => {
    const delay = getDelay(1, 1000, 10000);
    expect(delay).toBeGreaterThanOrEqual(2000);
    expect(delay).toBeLessThan(3000);
  });

  it("caps at maxDelayMs", () => {
    const delay = getDelay(10, 1000, 5000);
    expect(delay).toBeLessThanOrEqual(5000);
  });

  it("adds jitter (non-deterministic)", () => {
    const delays = new Set<number>();
    for (let i = 0; i < 20; i++) {
      delays.add(getDelay(0, 1000, 10000));
    }
    expect(delays.size).toBeGreaterThan(1);
  });
});

describe("withRetry", () => {
  it("returns the result on first success", async () => {
    const result = await withRetry(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("retries on retryable errors and succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(
      () => {
        attempts++;
        if (attempts < 3) throw new Error("429 rate limit");
        return Promise.resolve("recovered");
      },
      { baseDelayMs: 1, maxDelayMs: 10 }
    );
    expect(result).toBe("recovered");
    expect(attempts).toBe(3);
  });

  it("throws immediately on non-retryable errors", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        () => {
          attempts++;
          throw new Error("403 Forbidden");
        },
        { baseDelayMs: 1, maxDelayMs: 10 }
      )
    ).rejects.toThrow("403 Forbidden");
    expect(attempts).toBe(1);
  });

  it("throws after max attempts exhausted", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        () => {
          attempts++;
          throw new Error("429 rate limit");
        },
        { maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 10 }
      )
    ).rejects.toThrow("429 rate limit");
    expect(attempts).toBe(2);
  });

  it("respects custom shouldRetry", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        () => {
          attempts++;
          throw new Error("custom fail");
        },
        {
          maxAttempts: 3,
          baseDelayMs: 1,
          maxDelayMs: 10,
          shouldRetry: (err) => err instanceof Error && err.message === "custom fail",
        }
      )
    ).rejects.toThrow("custom fail");
    expect(attempts).toBe(3);
  });

  it("uses DEFAULT_RETRY_OPTIONS when no overrides", () => {
    expect(DEFAULT_RETRY_OPTIONS.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY_OPTIONS.baseDelayMs).toBe(1000);
    expect(DEFAULT_RETRY_OPTIONS.maxDelayMs).toBe(10000);
  });
});
