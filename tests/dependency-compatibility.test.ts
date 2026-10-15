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
  it('keeps source-unused incompatible dependencies out of the production package', () => {
    const manifest = readJson<PackageManifest>('package.json');
    const lockfile = readJson<PackageLock>('package-lock.json');
    const removedDependencies = ['p-retry', 'undici'];

    expect(manifest.engines?.node).toBe('>=18.0.0');

    for (const dependency of removedDependencies) {
      expect(manifest.dependencies).not.toHaveProperty(dependency);
      expect(lockfile.packages?.['']?.dependencies).not.toHaveProperty(dependency);
      expect(lockfile.packages).not.toHaveProperty(`node_modules/${dependency}`);
    }
  });
});
