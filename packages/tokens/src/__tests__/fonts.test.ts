import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { preloadFont } from '../fonts.ts';

describe('preloadFont', () => {
  it.each([
    '/_app/immutable/assets/inter-latin-wght-normal.Cx9a1b2.woff2',
    '/assets/jetbrains-mono-latin-wght-normal-AbC123.woff2',
    'inter-latin-wght-normal.woff2',
    'jetbrains-mono-latin-wght-normal.woff2',
  ])('preloads %s', (path) => {
    expect(preloadFont(path)).toBe(true);
  });

  it.each([
    '/assets/inter-latin-ext-wght-normal.Cx9a1b2.woff2',
    'jetbrains-mono-latin-ext-wght-normal.woff2',
    '/assets/inter-latin-wght-normal.Cx9a1b2.woff',
    '/assets/logo.woff2',
    '/_app/immutable/chunks/app.js',
  ])('does not preload %s', (path) => {
    expect(preloadFont(path)).toBe(false);
  });
});

describe('font display', () => {
  const faces = [...readFileSync(new URL('../../fonts.css', import.meta.url), 'utf8').matchAll(/@font-face\s*\{([^}]+)\}/g)]
    .map((match) => match[1]!)
    .filter((face) => face.includes('url('));

  it('never swaps in a preloaded face after the first paint', () => {
    const preloaded = faces.filter((face) => preloadFont(face.match(/url\(([^)]+)\)/)![1]!));
    expect(preloaded).toHaveLength(2);
    for (const face of preloaded) expect(face).toContain('font-display: optional;');
  });

  it('still swaps in the latin-ext faces, which load only when a page uses them', () => {
    const onDemand = faces.filter((face) => !preloadFont(face.match(/url\(([^)]+)\)/)![1]!));
    expect(onDemand).toHaveLength(2);
    for (const face of onDemand) expect(face).toContain('font-display: swap;');
  });
});

describe('metric-adjusted font fallbacks', () => {
  const readCss = (name: string) => readFileSync(new URL(`../../${name}.css`, import.meta.url), 'utf8');

  it.each(['tokens', 'theme'])('puts local fallbacks immediately after the web fonts in %s.css', (name) => {
    const css = readCss(name);
    for (const role of ['heading', 'body']) {
      expect(css).toContain(`--font-${role}: 'Inter Variable', 'Inter Fallback', 'Inter',`);
    }
    expect(css).toContain("--font-mono: 'JetBrains Mono Variable', 'JetBrains Mono Fallback', 'JetBrains Mono',");
  });

  it.each([
    ['Inter Fallback', 'Arial', 'Liberation Sans'],
    ['JetBrains Mono Fallback', 'Courier New', 'Liberation Mono'],
  ])('gives %s regular and bold local faces with all four overrides', (family, local, linux) => {
    const css = readCss('fonts');
    const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)]
      .map((match) => match[1]!)
      .filter((face) => face.includes(`font-family: '${family}';`));
    expect(faces).toHaveLength(2);
    for (const [index, weight] of [400, 700].entries()) {
      const face = faces[index]!;
      expect(face).toContain(`font-weight: ${weight};`);
      const suffix = weight === 700 ? ' Bold' : '';
      expect(face).toContain(`local('${local}${suffix}')`);
      expect(face).toContain(`local('${linux}${suffix}')`);
      expect(face).toMatch(/size-adjust: [1-9]\d*(?:\.\d+)?%;/);
      expect(face).toMatch(/ascent-override: [1-9]\d*(?:\.\d+)?%;/);
      expect(face).toMatch(/descent-override: [1-9]\d*(?:\.\d+)?%;/);
      expect(face).toContain('line-gap-override: 0%;');
    }
  });
});
