import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

const runNode = (code, inputType = 'module') => execFileSync(
    process.execPath,
    [`--input-type=${inputType}`, '-e', code],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
).trim();

const exportNames = [
    'ValidationProvider',
    'createValidationContext',
    'usePValidation',
    'usePValidationContext',
    'useValidation',
    'useValidationContext',
    'useValidationValue',
    'validateValue',
    'validationConfig',
];

describe('package', () => {
    it('is an ES module that only publishes src', () => {
        expect(pkg.type).toBe('module');
        expect(pkg.files).toEqual(['src']);
        expect(pkg.exports['.']).toEqual({ types: './src/index.d.ts', default: './src/index.js' });
    });

    it('supports React 18 and 19', () => {
        expect(pkg.peerDependencies.react).toBe('^18.0.0 || ^19.0.0');
    });

    it('can be imported by name from plain Node', () => {
        const names = runNode("const m = await import('v4react'); console.log(Object.keys(m).sort().join(','));");
        expect(names.split(',')).toEqual(exportNames);
    });

    it.runIf(process.features.require_module)('can be required from CommonJS', () => {
        expect(runNode("console.log(typeof require('v4react').useValidation);", 'commonjs')).toBe('function');
    });

    it('blocks deep imports of internal files', () => {
        expect(() => runNode("await import('v4react/src/validation/context.js');")).toThrow(/ERR_PACKAGE_PATH_NOT_EXPORTED/);
    });

    it('exposes package.json', () => {
        const version = runNode("const p = await import('v4react/package.json', { with: { type: 'json' } }); console.log(p.default.version);");
        expect(version).toBe(pkg.version);
    });
});
