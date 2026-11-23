import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Exact security-reviewed pin: later 11.x releases drop Node 18 support.
const patchedVersion = '11.0.1';
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const args = process.argv.slice(2);
assert.ok(
  args.length === 0 || (args.length === 2 && args[0] === '--baseline'),
  'Usage: npm run check:minimatch-security [-- --baseline BASE_PACKAGE_LOCK]'
);

const manifest = readJson(new URL('../package.json', import.meta.url));
const lock = readJson(new URL('../package-lock.json', import.meta.url));
assert.equal(lock.lockfileVersion, 3, 'Expected npm lockfile v3');
assert.ok(lock.packages?.[''], 'Lockfile must contain the root package');
assert.deepEqual(
  lock.packages[''].dependencies,
  manifest.dependencies,
  'Runtime dependency declarations must match the manifest'
);

const copies = Object.entries(lock.packages).filter(
  ([path]) => path === 'node_modules/minimatch' || path.endsWith('/node_modules/minimatch')
);
assert.ok(copies.length > 0, 'Lockfile must contain minimatch');
for (const [path, entry] of copies) {
  assert.equal(entry.version, patchedVersion, `${path}: unapproved minimatch version`);
  assert.equal(entry.dev, true, `${path}: minimatch must remain dev-only`);
  assert.equal(entry.link, undefined, `${path}: registry package required`);
  assert.ok(entry.integrity, `${path}: integrity is required`);
}

assert.equal(manifest.overrides?.minimatch, patchedVersion, 'Keep the exact minimatch override');

// Optional implementation/review proof: compare every non-dev lock entry, not
// just direct dependency versions. No git, semver or network dependency needed.
if (args.length) {
  const baseline = readJson(args[1]);
  assert.equal(baseline.lockfileVersion, 3, 'Expected baseline npm lockfile v3');
  assert.ok(baseline.packages?.[''], 'Baseline must contain the root package');
  const runtimeMap = (packages) =>
    Object.fromEntries(
      Object.entries(packages)
        .filter(([, entry]) => entry.dev !== true)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    );
  assert.deepEqual(
    runtimeMap(lock.packages),
    runtimeMap(baseline.packages),
    'Runtime lockfile map changed from the supplied baseline'
  );
  console.log('Complete runtime lockfile map unchanged from baseline');
}

console.log(
  `Minimatch security gate passed: ${copies.length} dev-only copy/copies at ${patchedVersion}`
);
