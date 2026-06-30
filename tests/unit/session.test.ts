import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

describe('Session bootstrap contract', () => {
  it('exposes session bootstrap on finatic.v1', () => {
    const file = path.resolve(__dirname, '../../src/wrappers/v1.ts');
    const body = readFileSync(file, 'utf8');
    expect(body).toContain('startSession');
    expect(body).toContain('getPortalUrl');
    expect(body).toContain('initSession');
  });

  it('does not expose a legacy session wrapper module', () => {
    const file = path.resolve(__dirname, '../../src/wrappers/session.ts');
    expect(existsSync(file)).toBe(false);
  });
});
