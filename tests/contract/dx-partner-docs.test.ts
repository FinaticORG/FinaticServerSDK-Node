import { readFileSync } from 'fs';
import { resolve } from 'path';

const readme = readFileSync(resolve(__dirname, '../../README.md'), 'utf8');

const FORBIDDEN = [
  'createPortalLink',
  'createSession(',
  'getAccounts(',
  'get_all_positions',
  'openPortal',
];

describe('partner-facing README matches published v1', () => {
  it('documents getToken, getPortalUrl, and listAccounts', () => {
    expect(readme).toContain('v1.getToken()');
    expect(readme).toContain('v1.getPortalUrl');
    expect(readme).toContain('v1.listAccounts');
    expect(readme).toContain(
      'https://github.com/FinaticORG/FinaticClientSDK/blob/develop/README.md',
    );
    expect(readme).toContain('https://finatic.dev/AGENTS.md');
    expect(readme).toContain('https://finatic.dev/openapi.json');
  });

  it('does not document unpublished façade methods', () => {
    for (const snippet of FORBIDDEN) {
      expect(readme).not.toContain(snippet);
    }
  });
});
