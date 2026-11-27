import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        files: ['src/**/*.js'],
        extends: [js.configs.recommended, reactHooks.configs.flat.recommended],
        languageOptions: {
            ecmaVersion: 2020,
        },
    },
    {
        files: ['src/validation/context.js'],
        rules: {
            'no-control-regex': 'off',
        },
    },
    {
        files: ['src/validation/deps.js'],
        rules: {
            'react-hooks/refs': 'off',
        },
    },
]);
