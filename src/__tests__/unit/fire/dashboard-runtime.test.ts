import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createDebouncedTrigger } = require('../../../lib/dashboard/runtime/watch-runtime');

describe('dashboard watch runtime debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces rapid events into a single refresh callback', () => {
    const callback = vi.fn();
    const debounced = createDebouncedTrigger(callback, 250);

    debounced.trigger();
    debounced.trigger();
    debounced.trigger();

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(249);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancel prevents pending callback', () => {
    const callback = vi.fn();
    const debounced = createDebouncedTrigger(callback, 100);

    debounced.trigger();
    expect(debounced.isPending()).toBe(true);

    debounced.cancel();
    expect(debounced.isPending()).toBe(false);

    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();
  });
});
