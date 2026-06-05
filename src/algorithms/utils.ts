/**
 * Runs a generator to completion and returns its final return value.
 * @throws {Error} If the generator is not exhausted after the first call to next().
 */
export function runGenerator<TState, TReturn>(
  generator: Generator<TState, TReturn, unknown>
): TReturn {
  const result = generator.next();

  if (!result.done) {
    throw new Error(
      "Generator should have been exhausted since recordState is false."
    );
  }

  return result.value;
}
