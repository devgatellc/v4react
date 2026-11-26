import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import './test/react18/install.js';

const react18Modules = fileURLToPath(new URL('./test/react18/node_modules/', import.meta.url)).replace(/\\/g, '/');

const reactProject = (major, resolve) => ({
    resolve,
    test: {
        name: `react${major}`,
        environment: 'jsdom',
        include: ['test/react/**/*.test.{js,jsx}'],
        setupFiles: ['test/react/setup.js'],
        env: { REACT_MAJOR: String(major) },
    },
});

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'core',
                    environment: 'node',
                    include: ['test/core/**/*.test.js'],
                },
            },
            reactProject(19),
            reactProject(18, {
                alias: [
                    { find: /^react(\/.*)?$/, replacement: `${react18Modules}react$1` },
                    { find: /^react-dom(\/.*)?$/, replacement: `${react18Modules}react-dom$1` },
                    { find: /^@testing-library\/(react|dom|user-event)$/, replacement: `${react18Modules}@testing-library/$1` },
                ],
            }),
            {
                test: {
                    name: 'types',
                    typecheck: {
                        enabled: true,
                        only: true,
                        include: ['test/types/**/*.test-d.tsx'],
                        tsconfig: 'test/types/tsconfig.json',
                    },
                },
            },
        ],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.js'],
            thresholds: {
                statements: 98,
                branches: 96,
                functions: 100,
                lines: 100,
            },
        },
    },
});
