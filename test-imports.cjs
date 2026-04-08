'use strict';

const { FinaticServer } = require('./dist/index.cjs');

if (typeof FinaticServer !== 'function') {
  throw new Error(
    `Expected FinaticServer to be constructible, got ${typeof FinaticServer}`,
  );
}
