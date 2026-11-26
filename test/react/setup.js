import { afterEach, beforeEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

let consoleError;

beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    cleanup();

    const messages = consoleError.mock.calls.map(args => args.map(String).join(' '));
    consoleError.mockRestore();

    expect(messages, 'React logged errors or warnings during the test').toEqual([]);
});
