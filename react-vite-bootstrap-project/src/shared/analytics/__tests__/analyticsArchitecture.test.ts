import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcRoot = join(process.cwd(), 'src');
const yandexAdapter = 'src/shared/analytics/yandexMetrica.ts';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir)
    .flatMap((entry) => {
      const path = join(dir, entry);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) return [];
      if (stat.isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx)$/.test(entry) ? [path] : [];
    })
    .sort();
}

describe('analytics architecture', () => {
  it('keeps direct Yandex calls inside the analytics adapter', () => {
    const offenders = sourceFiles(srcRoot).filter((file) => {
      const rel = relative(process.cwd(), file).replaceAll('\\', '/');
      if (rel === yandexAdapter) return false;
      return /\bym\s*\(/.test(readFileSync(file, 'utf8'));
    });

    expect(offenders).toEqual([]);
  });
});
