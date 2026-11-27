import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { validationConfig } from '../../src/index.js';

const validators = validationConfig.validators;
const emptyValues = [null, undefined, '', NaN];

describe('required', () => {
    it.each(emptyValues)('fails for %o', value => {
        expect(validators.required(value)).toBe(false);
    });

    it.each([0, false, 'a', ' ', [], {}])('passes for %j', value => {
        expect(validators.required(value)).toBe(true);
    });
});

describe('requiredIf', () => {
    it.each([false, undefined, null, 0])('skips the check when the condition is %j', condition => {
        expect(validators.requiredIf('', condition)).toBe(true);
    });

    it('behaves like required when the condition is true', () => {
        expect(validators.requiredIf('', true)).toBe(false);
        expect(validators.requiredIf(null, true)).toBe(false);
        expect(validators.requiredIf('x', true)).toBe(true);
    });
});

describe('requireChecked', () => {
    it.each([
        [true, true],
        ['true', true],
        [1, true],
        [false, false],
        ['false', false],
        ['', false],
        [0, false],
        [null, false],
        [undefined, false],
    ])('requireChecked(%j) is %j', (value, expected) => {
        expect(validators.requireChecked(value)).toBe(expected);
    });
});

describe('number', () => {
    it.each([0, 5, -1.5, '5', '5.5', '-3', '1e3', '1E-3', '+5', '.5', '5.', '-0'])('passes for %j', value => {
        expect(validators.number(value)).toBe(true);
    });

    it.each(['abc', '5a', '1,000', '1.2.3', 'e5', '1e', '.', '+', '1_000'])('fails for %j', value => {
        expect(validators.number(value)).toBe(false);
    });

    it.each(['0x1A', '0b101', '0o7', 'Infinity', '-Infinity', '1e400'])('fails for the non-decimal string %j', value => {
        expect(validators.number(value)).toBe(false);
    });

    it.each([Infinity, -Infinity])('fails for %o', value => {
        expect(validators.number(value)).toBe(false);
    });

    it.each([false, true, {}, []])('fails for %o, which is not empty', value => {
        expect(validators.number(value)).toBe(false);
    });

    it.each([' ', '   ', '\t', '\n'])('fails for the blank string %j instead of reading it as 0', value => {
        expect(validators.number(value)).toBe(false);
    });

    it('passes for a number with spaces around it', () => {
        expect(validators.number(' 5 ')).toBe(true);
    });

    it('handles very long hostile input quickly', () => {
        const inputs = [
            `${'1'.repeat(50000)}x`,
            `1.${'1'.repeat(50000)}x`,
            `1e${'1'.repeat(50000)}x`,
            `${' '.repeat(50000)}1x`,
        ];

        const start = performance.now();
        for (const input of inputs) expect(validators.number(input)).toBe(false);
        expect(performance.now() - start).toBeLessThan(500);
    });

    it.each(emptyValues)('treats %o as empty and passes', value => {
        expect(validators.number(value)).toBe(true);
    });
});

describe('integer', () => {
    it.each([0, 5, -3, '5', '-3', 5.0])('passes for %j', value => {
        expect(validators.integer(value)).toBe(true);
    });

    it.each([5.5, '5.5', 'abc', '0x10', '1e400'])('fails for %j', value => {
        expect(validators.integer(value)).toBe(false);
    });

    it.each([false, true, {}, []])('fails for %o, which is not empty', value => {
        expect(validators.integer(value)).toBe(false);
    });

    it.each([' ', '\t'])('fails for the blank string %j instead of reading it as 0', value => {
        expect(validators.integer(value)).toBe(false);
    });

    it.each(emptyValues)('treats %o as empty and passes', value => {
        expect(validators.integer(value)).toBe(true);
    });
});

describe('min', () => {
    it.each([
        [3, 3, true],
        [4, 3, true],
        ['5', 3, true],
        [2, 3, false],
        ['2', 3, false],
        [0, 1, false],
        [-1, 0, false],
        [0, 0, true],
        ['abc', 3, false],
        [false, 1, false],
        [false, -1, false],
        [true, 0, false],
        [NaN, 5, true],
        [' ', -1, false],
        ['0x20', 3, false],
        ['Infinity', 3, false],
        [Infinity, 3, false],
    ])('min(%o, %j) is %j', (value, limit, expected) => {
        expect(validators.min(value, limit)).toBe(expected);
    });

    it('passes when the value or the limit is empty', () => {
        expect(validators.min('', 3)).toBe(true);
        expect(validators.min(null, 3)).toBe(true);
        expect(validators.min(5, undefined)).toBe(true);
        expect(validators.min(5, null)).toBe(true);
    });
});

describe('max', () => {
    it.each([
        [3, 3, true],
        [2, 3, true],
        ['2', 3, true],
        [4, 3, false],
        ['4', 3, false],
        [0, -1, false],
        [0, 0, true],
        ['abc', 3, false],
        [false, 1, false],
        [false, -1, false],
        [NaN, 5, true],
        [' ', 5, false],
        ['0x1', 3, false],
        ['-Infinity', 3, false],
        [-Infinity, 3, false],
    ])('max(%o, %j) is %j', (value, limit, expected) => {
        expect(validators.max(value, limit)).toBe(expected);
    });

    it('passes when the value or the limit is empty', () => {
        expect(validators.max('', 3)).toBe(true);
        expect(validators.max(5, undefined)).toBe(true);
    });
});

describe('minLength and maxLength', () => {
    it.each([
        ['abc', 3, true],
        ['ab', 3, false],
        [[1, 2], 2, true],
        [[1], 2, false],
    ])('minLength(%j, %j) is %j', (value, length, expected) => {
        expect(validators.minLength(value, length)).toBe(expected);
    });

    it.each([
        ['abc', 3, true],
        ['abcd', 3, false],
        [[1, 2], 2, true],
        [[1, 2, 3], 2, false],
    ])('maxLength(%j, %j) is %j', (value, length, expected) => {
        expect(validators.maxLength(value, length)).toBe(expected);
    });

    it.each(emptyValues)('both pass for the empty value %o', value => {
        expect(validators.minLength(value, 3)).toBe(true);
        expect(validators.maxLength(value, 3)).toBe(true);
    });

    it.each([false, true, 0, 5, {}])('both fail for %o, which has no length', value => {
        expect(validators.minLength(value, 0)).toBe(false);
        expect(validators.maxLength(value, 3)).toBe(false);
    });
});

describe('equals', () => {
    it.each([
        ['a', 'a', true],
        ['a', 'b', false],
        [5, 5, true],
        ['5', 5, false],
        [0, 0, true],
        [0, 1, false],
        [false, true, false],
        [false, false, true],
        [NaN, 5, true],
    ])('equals(%o, %j) is %j', (value, other, expected) => {
        expect(validators.equals(value, other)).toBe(expected);
    });

    it.each(emptyValues)('passes for the empty value %o', value => {
        expect(validators.equals(value, 'a')).toBe(true);
    });
});

describe('pattern', () => {
    it('tests a string pattern', () => {
        expect(validators.pattern('abc', '^a')).toBe(true);
        expect(validators.pattern('xbc', '^a')).toBe(false);
        expect(validators.pattern('ABC', '^a')).toBe(false);
    });

    it('accepts a pattern with flags', () => {
        expect(validators.pattern('ABC', { pattern: '^a', flags: 'i' })).toBe(true);
        expect(validators.pattern('123', { pattern: '^a', flags: 'i' })).toBe(false);
    });

    it('accepts a pattern object without flags or with empty or null flags', () => {
        expect(validators.pattern('x', { pattern: '^x$' })).toBe(true);
        expect(validators.pattern('abc', { pattern: '^x$' })).toBe(false);
        expect(validators.pattern('x', { pattern: '^x$', flags: '' })).toBe(true);
        expect(validators.pattern('abc', { pattern: '^x$', flags: '' })).toBe(false);
        expect(validators.pattern('x', { pattern: '^x$', flags: null })).toBe(true);
        expect(validators.pattern('X', { pattern: '^x$', flags: null })).toBe(false);
        expect(validators.pattern('abc', { pattern: '^x$', flags: null })).toBe(false);
    });

    it('accepts a RegExp and keeps its flags', () => {
        expect(validators.pattern('ABC', /^[a-z]+$/i)).toBe(true);
        expect(validators.pattern('123', /^[a-z]+$/i)).toBe(false);
        expect(validators.pattern('ABC', /^[a-z]+$/)).toBe(false);
    });

    it('accepts a RegExp from another realm and keeps its flags', () => {
        const regex = runInNewContext('/^[a-z]+$/i');

        expect(regex instanceof RegExp).toBe(false);
        expect(validators.pattern('ABC', regex)).toBe(true);
        expect(validators.pattern('123', regex)).toBe(false);
    });

    it('fails for a pattern object without a string pattern', () => {
        expect(validators.pattern('abc', { patern: '^x$' })).toBe(false);
        expect(validators.pattern('abc', { flags: 'i' })).toBe(false);
        expect(validators.pattern('abc', {})).toBe(false);
    });

    it('fails instead of throwing for an invalid pattern or invalid flags', () => {
        expect(validators.pattern('[', '[')).toBe(false);
        expect(validators.pattern('a', { pattern: '[' })).toBe(false);
        expect(validators.pattern('a', { pattern: 'a', flags: 'zz' })).toBe(false);
    });

    it('passes when there is no pattern', () => {
        expect(validators.pattern('abc', undefined)).toBe(true);
        expect(validators.pattern('abc', null)).toBe(true);
    });

    it('passes when a conditional pattern is turned off with a falsy value, like min and max', () => {
        const isUk = false;

        expect(validators.pattern('abc', isUk && '^[A-Z]{2}\\d{6}$')).toBe(true);
        expect(validators.pattern('abc', '')).toBe(true);
        expect(validators.pattern('abc', 0)).toBe(true);
        expect(validators.min(5, false)).toBe(true);
        expect(validators.max(5, false)).toBe(true);
    });

    it('gives the same answer every time for a global RegExp', () => {
        const regex = /^a/g;

        expect(validators.pattern('abc', regex)).toBe(true);
        expect(validators.pattern('abc', regex)).toBe(true);
    });

    it('tests numbers including 0', () => {
        expect(validators.pattern(0, '^0$')).toBe(true);
        expect(validators.pattern(12, '^\\d$')).toBe(false);
    });

    it('tests false instead of skipping it as empty', () => {
        expect(validators.pattern(false, '^true$')).toBe(false);
        expect(validators.pattern(false, '^false$')).toBe(true);
    });

    it.each(emptyValues)('passes for the empty value %o', value => {
        expect(validators.pattern(value, '^a')).toBe(true);
    });
});

describe('email', () => {
    it.each([
        'a@b.co',
        'first.last@sub.example.org',
        'user+tag@example.com',
        'x_y-z@example.io',
        '"john doe"@example.com',
        '"John.Doe[1]"@example.com',
        '"a\\"b"@example.com',
        'ünïcödé@example.com',
        'a@ex-ample.com',
        'a@xn--bcher-kva.ch',
        'a@例え.テスト',
    ])('accepts %j', value => {
        expect(validators.email(value)).toBe(true);
    });

    it.each([
        'plainaddress',
        '@example.com',
        'user@',
        'user@example',
        'user name@example.com',
        'user@exa mple.com',
        'user@@example.com',
        'user@example..com',
        'user@sub..example.com',
        'user@sub.-example.com',
        'user@sub-.example.com',
        'user@sub._example.com',
        'a@example.com-',
        'user@exam_ple.com',
        'user@exam~ple.com',
        'user@sub.exam_ple.com',
        'user@example.co_m',
    ])('rejects %j', value => {
        expect(validators.email(value)).toBe(false);
    });

    it('accepts up to 254 characters', () => {
        expect(validators.email(`a@${'b'.repeat(248)}.com`)).toBe(true);
        expect(validators.email(`a@${'b'.repeat(249)}.com`)).toBe(false);
    });

    it('handles very long hostile input quickly', () => {
        const inputs = [
            `a@${'a.'.repeat(25000)}!`,
            `a@${'a-a.'.repeat(10000)}!`,
            `a@a.${'a'.repeat(50000)}!`,
            `${'a.'.repeat(25000)}@`,
            `"${' '.repeat(50000)}`,
            `a@${'a.'.repeat(125)}!`,
            `a@a.${'a'.repeat(249)}!`,
            `"${'a'.repeat(40)}`,
            `"${'a'.repeat(253)}`,
            `"${'a '.repeat(126)}`,
        ];

        const start = performance.now();
        for (const input of inputs) expect(validators.email(input)).toBe(false);
        expect(performance.now() - start).toBeLessThan(500);
    });

    it.each(emptyValues)('treats %o as empty and passes, so it can be optional', value => {
        expect(validators.email(value)).toBe(true);
    });

    it.each([false, 0, 123, true, [], {}])('rejects the non-string %o', value => {
        expect(validators.email(value)).toBe(false);
    });
});

describe('url', () => {
    it.each([
        'example.com',
        'www.example.com',
        'http://example.com',
        'https://sub.domain.co.uk/a/b?q=1#x',
        'HTTPS://EXAMPLE.COM',
    ])('accepts the common address %j', value => {
        expect(validators.url(value)).toBe(true);
    });

    it.each([
        'https://example.museum',
        'https://example.photography',
        'http://localhost',
        'http://localhost:3000/api',
        'localhost:3000',
        'http://192.168.0.1',
        'http://192.168.0.1:8080/x',
        'https://xn--mnchen-3ya.de',
        'https://example.xn--p1ai',
    ])('accepts long domain endings, localhost, IPv4 and punycode: %j', value => {
        expect(validators.url(value)).toBe(true);
    });

    it.each(['http://x.com:0', 'http://x.com:80', 'example.com:8080', 'http://x.com:65535'])('accepts the valid port in %j', value => {
        expect(validators.url(value)).toBe(true);
    });

    it.each(['http://x.com:65536', 'http://x.com:99999', 'http://x.com:123456'])('rejects the out-of-range port in %j', value => {
        expect(validators.url(value)).toBe(false);
    });

    it('accepts domain labels longer than 63 characters, like the original validator', () => {
        expect(validators.url(`${'a'.repeat(64)}.com`)).toBe(true);
    });

    it.each([
        'nope',
        'http://nope',
        'example',
        'example.c',
        'http://999.1.1.1',
        'http://-bad.com',
        'http://bad-.com',
        'http://exa mple.com',
        'http://example.com/has space',
        'ftp://example.com',
        '://example.com',
        'http://',
        'example..com',
        'user@example.com',
        'example.com|foo',
    ])('rejects %j', value => {
        expect(validators.url(value)).toBe(false);
    });

    it.each(emptyValues)('treats %o as empty and passes, so it can be optional', value => {
        expect(validators.url(value)).toBe(true);
    });

    it.each([false, 0, 123, true, [], {}])('rejects the non-string %o', value => {
        expect(validators.url(value)).toBe(false);
    });

    it('handles very long hostile input quickly', () => {
        const inputs = [
            `${'a'.repeat(50000)}!`,
            `${`${'a'.repeat(60)}.`.repeat(2000)}!`,
            `a${'-'.repeat(50000)}!`,
            `${'a-'.repeat(25000)}.com!`,
            `http://${'a.'.repeat(25000)}!`,
            `x.com:${'1'.repeat(50000)}`,
        ];

        const start = performance.now();
        for (const input of inputs) expect(validators.url(input)).toBe(false);
        expect(performance.now() - start).toBeLessThan(500);
    });
});
