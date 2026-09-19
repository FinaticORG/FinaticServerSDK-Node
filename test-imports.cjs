'use strict';

const {
  FDXFutureInstrumentDetailsIdentityQualityEnum,
  FDXInstrumentDescriptorVersionEnum,
  FinaticServer,
} = require('./dist/index.cjs');

if (typeof FinaticServer !== 'function') {
  throw new Error(`Expected FinaticServer to be constructible, got ${typeof FinaticServer}`);
}

if (
  FDXFutureInstrumentDetailsIdentityQualityEnum.Exact !== 'EXACT' ||
  FDXInstrumentDescriptorVersionEnum._10 !== '1.0'
) {
  throw new Error('Expected exact instrument descriptor enums in the CommonJS package');
}
