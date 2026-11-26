import { describe, expect, it } from 'vitest';
import { version } from 'react';
import { version as domVersion } from 'react-dom';

describe('test environment', () => {
    it(`runs react and react-dom ${process.env.REACT_MAJOR}`, () => {
        expect(version.split('.')[0]).toBe(process.env.REACT_MAJOR);
        expect(domVersion.split('.')[0]).toBe(process.env.REACT_MAJOR);
    });
});
