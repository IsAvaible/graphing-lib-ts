import { useState, useRef, useEffect, useCallback } from "react";
import { type VisualState, INITIAL_VISUAL_STATE } from "@/ui/types.ts";

type GeneratorFactory<T> = () => Generator<VisualState<T>, any, unknown> | null;

export function useAlgorithmRunner<T>(
  generatorFactory: GeneratorFactory<T> | null,
  intervalMs: number = 600
) {
  const [visualState, setVisualState] =
    useState<VisualState<T>>(INITIAL_VISUAL_STATE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null); // Added error state

  const generatorRef = useRef<Generator<VisualState<T>, any, unknown> | null>(
    null
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (generatorFactory) {
      generatorRef.current = generatorFactory();
    } else {
      generatorRef.current = null;
    }
    setVisualState(INITIAL_VISUAL_STATE);
    setIsPlaying(false);
    setError(null); // Clear error on reset
  }, [generatorFactory]);

  // Re-initialize when the factory changes (e.g., new graph or new algorithm selected)
  useEffect(() => {
    reset();
  }, [reset]);

  const stepForward = useCallback(() => {
    if (!generatorRef.current) return;

    try {
      const result = generatorRef.current.next();

      if (result.done) {
        setIsPlaying(false);
        // Clear current/queued nodes when finished
        setVisualState((prev) => ({
          ...prev,
          currentNode: null,
          queuedNodes: new Set()
        }));
        return;
      }

      setVisualState(result.value);
    } catch (err: any) {
      // Stop execution and surface the error message
      setIsPlaying(false);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred in the algorithm."
      );
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(stepForward, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, stepForward, intervalMs]);

  return {
    visualState,
    isPlaying,
    error,
    togglePlay: () => setIsPlaying((p) => !p),
    stepForward,
    reset
  };
}
