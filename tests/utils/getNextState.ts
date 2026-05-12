import { expect } from "vitest";

// Helper to safely unpack and assert a generator step
export function getNextState<T>(generator: Generator<T, any, unknown>): T {
  const result = generator.next();
  expect(result.done).toBe(false);
  if (result.done) throw new Error("Generator finished early unexpectedly");
  return result.value satisfies T;
}
