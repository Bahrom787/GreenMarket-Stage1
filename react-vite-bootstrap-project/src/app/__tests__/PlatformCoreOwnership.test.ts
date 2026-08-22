import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const repoRoot = join(appRoot, '..');
const appSrc = join(appRoot, 'src');
const canonicalCore = join(appSrc, 'platform-core');
const importAliasConfigFiles = ['vite.config.ts', 'tsconfig.json', 'tsconfig.node.json']
  .map((file) => join(appRoot, file))
  .filter((path) => existsSync(path));
const runtimeSourceExtensions = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const referencePlatformCoreImport =
  /\b(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s*)["'`][^"'`]*(?:greenmarket[\\/]+GreenMarket|greenmarket[\\/])[^"'`]*["'`]/i;
const referencePlatformCorePath = /greenmarket[\\/]+GreenMarket|["'`][^"'`]*\.\.[\\/]+greenmarket[\\/]/i;

function runtimeSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      const stat = lstatSync(path);

      if (stat.isSymbolicLink()) {
        return [];
      }

      if (entry.isDirectory()) {
        return runtimeSourceFiles(path);
      }

      if (!entry.isFile() || !runtimeSourceExtensions.has(extname(entry.name))) {
        return [];
      }

      return [path];
    });
}

describe('Platform Core ownership', () => {
  it('keeps StoreHome in the canonical runtime Platform Core copy', () => {
    expect(existsSync(canonicalCore)).toBe(true);
    expect(existsSync(join(canonicalCore, 'builders', 'StoreHomeBuilder.ts'))).toBe(true);
    expect(existsSync(join(canonicalCore, 'screens', 'StoreHomeScreen.ts'))).toBe(true);
    expect(existsSync(join(canonicalCore, 'viewmodels', 'StoreHomeViewModel.ts'))).toBe(true);
  });

  it('does not import the reference Platform Core copy from app runtime source', () => {
    const sourceFiles = runtimeSourceFiles(appSrc);

    const forbiddenImports = sourceFiles
      .map((path) => ({
        path,
        text: readFileSync(path, 'utf8'),
      }))
      .filter(({ text }) => referencePlatformCoreImport.test(text))
      .map(({ path }) => relative(repoRoot, path));

    expect(forbiddenImports).toEqual([]);
  });

  it('does not alias runtime imports to the reference Platform Core copy', () => {
    const forbiddenAliases = importAliasConfigFiles
      .map((path) => ({
        path,
        text: readFileSync(path, 'utf8'),
      }))
      .filter(({ text }) => referencePlatformCorePath.test(text))
      .map(({ path }) => relative(repoRoot, path));

    expect(forbiddenAliases).toEqual([]);
  });
});
