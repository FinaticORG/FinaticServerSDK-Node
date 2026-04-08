import { FinaticServer } from './dist/index.mjs';

if (typeof FinaticServer !== 'function') {
  throw new Error(
    `Expected FinaticServer to be constructible, got ${typeof FinaticServer}`,
  );
}
