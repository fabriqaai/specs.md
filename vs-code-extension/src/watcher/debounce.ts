/**
 * Debounce utility for delaying function execution.
 * Used to prevent rapid consecutive calls during file system events.
 */

/**
 * Result of creating a debounced function.
 */
export interface DebouncedFunction<T extends (...args: unknown[]) => void> {
    /** Call the debounced function */
    call: (...args: Parameters<T>) => void;
    /** Cancel any pending execution */
    cancel: () => void;
    /** Check if there's a pending execution */
    isPending: () => boolean;
}

/**
 * Creates a debounced version of a function.
 * The function will only be called after the specified delay has passed
 * without any new calls.
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Object with call, cancel, and isPending methods
 *
 * @example
 * ```typescript
 * const debounced = debounce(() => console.log('called'), 100);
 *
 * debounced.call(); // Schedules call
 * debounced.call(); // Resets timer
 * debounced.call(); // Resets timer
 * // After 100ms of quiet: 'called' is logged once
 *
 * debounced.cancel(); // Cancel pending call
 * ```
 */
export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
): DebouncedFunction<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const call = (...args: Parameters<T>): void => {
        // Clear existing timer
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        // Set new timer
        timeoutId = setTimeout(() => {
            timeoutId = null;
            fn(...args);
        }, delay);
    };

    const cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    const isPending = (): boolean => {
        return timeoutId !== null;
    };

    return { call, cancel, isPending };
}
