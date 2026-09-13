import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readme = readFileSync(resolve(__dirname, '../../README.md'), 'utf8');
const quickStartFixture = readFileSync(
  resolve(__dirname, 'fixtures/readme-quick-start.ts'),
  'utf8'
).trim();

const FORBIDDEN = [
  'createPortalLink',
  'createSession(',
  'getAccounts(',
  'get_all_positions',
  'openPortal',
];

describe('partner-facing README matches published v1', () => {
  it('keeps the documented quick start identical to its typechecked fixture', () => {
    const quickStart = readme.match(/## Quick start\s+```ts\n([\s\S]*?)\n```/)?.[1];

    expect(quickStart).toBe(quickStartFixture);
    expect(() =>
      execFileSync(
        process.execPath,
        [
          resolve(__dirname, '../../node_modules/typescript/bin/tsc'),
          '--project',
          resolve(__dirname, 'tsconfig.readme.json'),
          '--pretty',
          'false',
        ],
        { stdio: 'pipe' }
      )
    ).not.toThrow();
  });

  it('documents getToken, getPortalUrl, and listAccounts', () => {
    expect(readme).toContain('v1.getToken()');
    expect(readme).toContain('v1.getPortalUrl');
    expect(readme).toContain('v1.listAccounts');
    expect(readme).toContain(
      'https://github.com/FinaticORG/FinaticClientSDK/blob/develop/README.md'
    );
    expect(readme).toContain('https://finatic.dev/AGENTS.md');
    expect(readme).toContain('https://finatic.dev/openapi.json');
  });

  it('stops before account reads when the authenticated session fails', () => {
    const authenticatedStart = readme.indexOf(
      'const authenticatedSession = await finatic.v1.startSession'
    );
    const authenticatedGuard = readme.indexOf('if (!authenticatedSession.session_id)');
    const accountRead = readme.indexOf('finatic.v1.listAccounts<AccountSummary[]>');

    expect(authenticatedStart).toBeGreaterThan(-1);
    expect(authenticatedGuard).toBeGreaterThan(authenticatedStart);
    expect(accountRead).toBeGreaterThan(authenticatedGuard);
  });

  it('does not document unpublished façade methods', () => {
    for (const snippet of FORBIDDEN) {
      expect(readme).not.toContain(snippet);
    }
  });
});
