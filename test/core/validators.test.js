import { describe, expect, it } from 'vitest';
import { validationConfig } from '../../src/index.js';

const validators = validationConfig.validators;
const emptyValues = [null, undefined, ''];

describe('required', () => {
    it.each(emptyValues)('fails for %j', value => {
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
    it.each([0, 5, -1.5, '5', '5.5', '-3', '1e3'])('passes for %j', value => {
        expect(validators.number(value)).toBe(true);
    });

    it.each(['abc', '5a', '1,000'])('fails for %j', value => {
        expect(validators.number(value)).toBe(false);
    });

    it.each(emptyValues)('treats %j as empty and passes', value => {
        expect(validators.number(value)).toBe(true);
    });
});

describe('integer', () => {
    it.each([0, 5, -3, '5', '-3', 5.0])('passes for %j', value => {
        expect(validators.integer(value)).toBe(true);
    });

    it.each([5.5, '5.5', 'abc'])('fails for %j', value => {
        expect(validators.integer(value)).toBe(false);
    });

    it.each(emptyValues)('treats %j as empty and passes', value => {
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
    ])('min(%j, %j) is %j', (value, limit, expected) => {
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
    ])('max(%j, %j) is %j', (value, limit, expected) => {
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

    it.each(emptyValues)('both pass for the empty value %j', value => {
        expect(validators.minLength(value, 3)).toBe(true);
        expect(validators.maxLength(value, 3)).toBe(true);
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
    ])('equals(%j, %j) is %j', (value, other, expected) => {
        expect(validators.equals(value, other)).toBe(expected);
    });

    it.each(emptyValues)('passes for the empty value %j', value => {
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
    });

    it('tests numbers including 0', () => {
        expect(validators.pattern(0, '^0$')).toBe(true);
        expect(validators.pattern(12, '^\\d$')).toBe(false);
    });

    it.each(emptyValues)('passes for the empty value %j', value => {
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
        'ünïcödé@example.com',
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
    ])('rejects %j', value => {
        expect(validators.email(value)).toBe(false);
    });

    it.each(emptyValues)('treats %j as empty and passes, so it can be optional', value => {
        expect(validators.email(value)).toBe(true);
    });

    it.each([false, NaN, 0, 123, true, [], {}])('rejects the non-string %o', value => {
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

    it.each(emptyValues)('treats %j as empty and passes, so it can be optional', value => {
        expect(validators.url(value)).toBe(true);
    });

    it.each([false, NaN, 0, 123, true, [], {}])('rejects the non-string %o', value => {
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
