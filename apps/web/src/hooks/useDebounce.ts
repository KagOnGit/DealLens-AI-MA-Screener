import { useCallback, useRef } from 'react';

/**
 * A hook that returns a debounced version of the callback function.
 * The debounced function will delay invoking the callback until after `delay` milliseconds
 * have elapsed since the last time it was invoked.
 * 
 * @param callback The function to debounce
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The debounced version of the callback function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}
