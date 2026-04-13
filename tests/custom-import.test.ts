import { FinaticServer } from '../src/FinaticServer';

describe('Custom FinaticServer import', () => {
  it('is the protected subclass with marker', () => {
    expect(FinaticServer).toBeDefined();
    expect(FinaticServer.__CUSTOM_CLASS__).toBe(true);
  });
});
