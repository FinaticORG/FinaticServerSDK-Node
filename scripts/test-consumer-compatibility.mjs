import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error('npm_execpath is required; run this check through npm');
}

const runNpm = (args, options = {}) =>
  execFileSync(process.execPath, [npmCli, ...args], {
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    ...options,
  });

const temporaryRoot = mkdtempSync(join(tmpdir(), 'finatic-sdk-consumer-'));
const packageDirectory = join(temporaryRoot, 'package');
const consumerDirectory = join(temporaryRoot, 'consumer');

try {
  mkdirSync(packageDirectory);
  mkdirSync(consumerDirectory);
  writeFileSync(
    join(consumerDirectory, 'package.json'),
    JSON.stringify({ name: 'finatic-sdk-compatibility-consumer', private: true }, null, 2)
  );

  const packResult = JSON.parse(
    runNpm(['pack', '--json', '--pack-destination', packageDirectory], { capture: true })
  );
  const tarball = join(packageDirectory, packResult[0].filename);

  runNpm(
    [
      'install',
      '--engine-strict',
      '--ignore-scripts',
      '--omit=dev',
      '--package-lock=false',
      tarball,
    ],
    { cwd: consumerDirectory }
  );

  execFileSync(process.execPath, ['-e', "require('@finatic/server-node')"], {
    cwd: consumerDirectory,
    stdio: 'inherit',
  });
  execFileSync(
    process.execPath,
    ['--input-type=module', '-e', "await import('@finatic/server-node')"],
    { cwd: consumerDirectory, stdio: 'inherit' }
  );

  console.log(`Packed consumer compatibility passed on ${process.version}`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
