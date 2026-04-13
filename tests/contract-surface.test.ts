import * as fs from 'fs';
import * as path from 'path';

describe('Node SDK contract surface', () => {
  it('preserves custom FinaticServer subclass marker in source', () => {
    const filePath = path.join(__dirname, '../src/FinaticServer.ts');
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).toContain('__CUSTOM_CLASS__');
  });
});
