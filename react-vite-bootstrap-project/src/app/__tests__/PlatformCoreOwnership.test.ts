import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const repoRoot = join(appRoot, '..');
const appSrc = join(appRoot, 'src');
const canonicalCore = join(appSrc, 'platform-core');
const referenceCore = join(repoRoot, 'greenmarket', 'GreenMarket');

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

describe('Platform Core ownership', () => {
  it('keeps the app runtime on the canonical Platform Core copy only', () => {
    const sourceFiles = files(appSrc).filter((path) => /\.(ts|tsx)$/.test(path));

    expect(existsSync(canonicalCore)).toBe(true);
    expect(existsSync(referenceCore)).toBe(true);
    expect(existsSync(join(canonicalCore, 'builders', 'StoreHomeBuilder.ts'))).toBe(true);
    expect(existsSync(join(canonicalCore, 'screens', 'StoreHomeScreen.ts'))).toBe(true);
    expect(existsSync(join(canonicalCore, 'viewmodels', 'StoreHomeViewModel.ts'))).toBe(true);

    const forbiddenImports = sourceFiles
      .map((path) => ({
        path,
        text: readFileSync(path, 'utf8'),
      }))
      .filter(({ text }) => /from ['"][^'"]*greenmarket\/GreenMarket|from ['"][^'"]*\.\.\/\.\.\/greenmarket/.test(text))
      .map(({ path }) => relative(repoRoot, path));

    expect(forbiddenImports).toEqual([]);
  });
});
