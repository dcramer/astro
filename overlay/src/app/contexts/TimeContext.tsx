"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface TimeContextValue {
  now: number;
}

const TimeContext = createContext<TimeContextValue | undefined>(undefined);

interface TimeProviderProps {
  children: ReactNode;
  intervalMs?: number;
}

/**
 * Provides a shared time value that updates at a regular interval.
 * This prevents multiple components from creating their own intervals.
 */
export function TimeProvider({ children, intervalMs = 1000 }: TimeProviderProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  return (
    <TimeContext.Provider value={{ now }}>
      {children}
    </TimeContext.Provider>
  );
}

/**
 * Hook to get the current time from the shared context
 */
export function useTime(): number {
  const context = useContext(TimeContext);

  if (context === undefined) {
    // Fallback to static time if not in provider
    // This allows components to work outside the provider for testing
    return Date.now();
  }

  return context.now;
}

/**
 * Hook that provides a time value, either from context or local state
 * Useful for components that might be used outside the TimeProvider
 */
export function useTimeWithFallback(): number {
  const context = useContext(TimeContext);
  const [localNow, setLocalNow] = useState(() => Date.now());

  useEffect(() => {
    // Only create local interval if not in context
    if (context === undefined) {
      const intervalId = window.setInterval(() => {
        setLocalNow(Date.now());
      }, 1000);

      return () => {
        window.clearInterval(intervalId);
      };
    }
  }, [context]);

  return context?.now ?? localNow;
}