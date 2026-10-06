import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The dependency rule, enforced. Each layer lists what it may import ; anything else fails.
 * Relative imports are resolved to their layer ; bare imports (packages, `node:*`) are checked
 * against the layer's allowed packages.
 */
type Layer = 'domain' | 'application' | 'infrastructure' | 'boot' | 'main';

const RULES: Record<Layer, { layers: Layer[]; packages: RegExp }> = {
    // Pure : entities, rules, repository ports. Zod is used as a type language.
    domain: { layers: ['domain'], packages: /^zod$/ },
    // Use cases and ports. No I/O, no framework, no DI container. Shares the wire protocol types.
    application: { layers: ['domain', 'application'], packages: /^(zod|@blight\/protocol)$/ },
    // Adapters : may use external libraries, but never the composition root nor the DI container.
    infrastructure: {
        layers: ['domain', 'application', 'infrastructure'],
        packages:
            /^(node:.*|zod|@blight\/protocol|ws|koa|@koa\/router|koa-static|@laboralphy\/o876-txat)$/,
    },
    // Composition root : the only place that sees every layer, the DI container and @blight/games.
    boot: {
        layers: ['domain', 'application', 'infrastructure', 'boot'],
        packages: /^(node:.*|awilix|@blight\/games)$/,
    },
    main: { layers: ['boot'], packages: /^node:.*$/ },
};

const SRC = path.resolve(import.meta.dirname, '../src');

function layerOf(file: string): Layer {
    const relative = path.relative(SRC, file);
    const top = relative.split(path.sep)[0] ?? '';
    if (top === 'main.ts') {
        return 'main';
    }
    if (top in RULES) {
        return top as Layer;
    }
    throw new Error(`File outside of any layer: src/${relative} — add it to RULES`);
}

function sourceFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? sourceFiles(full) : full.endsWith('.ts') ? [full] : [];
    });
}

function importsOf(file: string): string[] {
    const source = fs.readFileSync(file, 'utf8');
    const pattern =
        /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
    return [...source.matchAll(pattern)].map((m) => (m[1] ?? m[2]) as string);
}

function classesOf(file: string): string[] {
    const source = fs.readFileSync(file, 'utf8');
    return [...source.matchAll(/^export\s+(?:abstract\s+)?class\s+(\w+)/gm)].map((m) => m[1]!);
}

describe('architecture', () => {
    const files = sourceFiles(SRC);

    it.each(files.map((f) => [path.relative(SRC, f), f]))(
        '%s respects the dependency rule',
        (_, file) => {
            const layer = layerOf(file);
            const rule = RULES[layer];
            const violations = importsOf(file).filter((specifier) => {
                if (specifier.startsWith('.')) {
                    const target = layerOf(path.resolve(path.dirname(file), specifier));
                    return !rule.layers.includes(target);
                }
                return !rule.packages.test(specifier);
            });
            expect(violations, `${layer} may not import these`).toEqual([]);
        }
    );

    it.each(files.map((f) => [path.relative(SRC, f), f]))(
        '%s holds at most one class, named after the file',
        (_, file) => {
            const classes = classesOf(file);
            expect(classes.length).toBeLessThanOrEqual(1);
            if (classes.length === 1) {
                expect(classes[0]).toBe(path.basename(file, '.ts'));
            }
        }
    );
});
