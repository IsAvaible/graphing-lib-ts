import { useState, useRef, useEffect, useCallback } from "react";
import { type VisualState, INITIAL_VISUAL_STATE } from "@/ui/types.ts";

type GeneratorFactory<T> = () => Generator<VisualState<T>, any, unknown> | null;

export function useAlgorithmRunner<T>(
  generatorFactory: GeneratorFactory<T> | null
) {
  const [visualState, setVisualState] =
    useState<VisualState<T>>(INITIAL_VISUAL_STATE);
  const [isPlaying, setIsPlaying] = useState(false);

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
  }, [generatorFactory]);

  // Re-initialize when the factory changes (e.g., new graph or new algorithm selected)
  useEffect(() => {
    reset();
  }, [reset]);

  const stepForward = useCallback(() => {
    if (!generatorRef.current) return;

    const result = generatorRef.current.next();

    if (result.done) {
      setIsPlaying(false);
      // Optionally clear current/queued nodes when finished
      setVisualState((prev) => ({
        ...prev,
        currentNode: null,
        queuedNodes: new Set()
      }));
      return;
    }

    setVisualState(result.value);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(stepForward, 600);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, stepForward]);

  return {
    visualState,
    isPlaying,
    togglePlay: () => setIsPlaying((p) => !p),
    stepForward,
    reset
  };
}
