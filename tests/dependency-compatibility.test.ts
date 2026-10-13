import * as fs from 'fs';
import * as path from 'path';

interface PackageManifest {
  dependencies?: Record<string, string>;
  engines?: {
    node?: string;
  };
}

interface PackageLock {
  packages?: Record<string, PackageManifest>;
}

const readJson = <T>(relativePath: string): T => {
  const filePath = path.join(__dirname, '..', relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
};

describe('production dependency compatibility', () => {
  it('keeps the Node 18 support contract free of the incompatible unused undici package', () => {
    const manifest = readJson<PackageManifest>('package.json');
    const lockfile = readJson<PackageLock>('package-lock.json');

    expect(manifest.engines?.node).toBe('>=18.0.0');
    expect(manifest.dependencies).not.toHaveProperty('undici');
    expect(lockfile.packages?.['']?.dependencies).not.toHaveProperty('undici');
    expect(lockfile.packages).not.toHaveProperty('node_modules/undici');
  });
});
