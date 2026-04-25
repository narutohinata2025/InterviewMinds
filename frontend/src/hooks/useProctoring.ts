import { useState, useEffect, useRef, useCallback } from "react";

interface ProctoringState {
  tabSwitchCount: number;
  isTabVisible: boolean;
  interviewDuration: number;
  warnings: string[];
}

export function useProctoring(active: boolean = false) {
  const [state, setState] = useState<ProctoringState>({
    tabSwitchCount: 0,
    isTabVisible: true,
    interviewDuration: 0,
    warnings: [],
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    startTimeRef.current = Date.now();

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setState((prev) => {
        const newState = { ...prev, isTabVisible: isVisible };
        if (!isVisible) {
          newState.tabSwitchCount = prev.tabSwitchCount + 1;
          newState.warnings = [
            ...prev.warnings,
            `Tab switch detected at ${formatTime(Math.floor((Date.now() - startTimeRef.current) / 1000))}`,
          ];
        }
        return newState;
      });
    };

    // Duration timer
    timerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        interviewDuration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active]);

  const formatDuration = useCallback((seconds: number): string => {
    return formatTime(seconds);
  }, []);

  return { ...state, formatDuration };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
