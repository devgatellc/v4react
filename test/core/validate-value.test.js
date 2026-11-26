import { describe, expect, it, vi } from 'vitest';
import { validateValue } from '../../src/index.js';

const error = (name, message = name) => ({ name, message });

describe('validateValue', () => {
    it('returns null when there are no rules', () => {
        expect(validateValue('x', null)).toBeNull();
        expect(validateValue('x', undefined)).toBeNull();
        expect(validateValue('x', [])).toBeNull();
    });

    it('returns null when every rule passes', () => {
        expect(validateValue('abc', ['required', { name: 'minLength', value: 2 }])).toBeNull();
    });

    it('reports a failed string rule using its name as the message', () => {
        expect(validateValue('', ['required'])).toEqual([error('required')]);
    });

    it('uses a custom message', () => {
        expect(validateValue('', [{ name: 'required', message: 'Please fill this in' }])).toEqual([error('required', 'Please fill this in')]);
    });

    it('reports every failed rule in rule order', () => {
        const rules = ['email', { name: 'minLength', value: 3 }, 'required', { name: 'maxLength', value: 5 }];
        expect(validateValue('ab', rules)).toEqual([error('email'), error('minLength')]);
    });

    it('skips empty rule entries', () => {
        expect(validateValue('', [null, undefined, false, 'required'])).toEqual([error('required')]);
    });

    it('ignores rules without a known validator', () => {
        expect(validateValue('', ['doesNotExist', { name: 'alsoMissing' }])).toBeNull();
    });

    it('passes the rule value to the validator', () => {
        expect(validateValue(2, [{ name: 'min', value: 3 }])).toEqual([error('min')]);
        expect(validateValue(4, [{ name: 'min', value: 3 }])).toBeNull();
    });

    it('calls a function rule value with the deps', () => {
        const value = vi.fn(deps => deps[0]);

        expect(validateValue('a', [{ name: 'equals', value }], ['b'])).toEqual([error('equals')]);
        expect(value).toHaveBeenCalledWith(['b']);
    });

    it('calls a custom validator with the value, rule value and deps', () => {
        const validator = vi.fn(() => false);

        expect(validateValue('x', [{ name: 'custom', value: 5, validator }], ['dep'])).toEqual([error('custom')]);
        expect(validator).toHaveBeenCalledWith('x', 5, ['dep']);
    });

    it('prefers a custom validator over a built-in with the same name', () => {
        expect(validateValue('', [{ name: 'required', validator: () => true }])).toBeNull();
    });

    describe('converts', () => {
        it('applies a built-in convert by name', () => {
            expect(validateValue('   ', [{ name: 'required', convert: 'trim' }])).toEqual([error('required')]);
            expect(validateValue('abc', [{ name: 'equals', value: 'ABC', convert: 'upper' }])).toBeNull();
            expect(validateValue('ABC', [{ name: 'equals', value: 'abc', convert: 'lower' }])).toBeNull();
        });

        it('ignores an unknown convert name', () => {
            expect(validateValue(' ', [{ name: 'required', convert: 'doesNotExist' }])).toBeNull();
        });

        it('calls a convert function with the value, rule value and deps', () => {
            const convert = vi.fn(value => value.replace(/-/g, ''));

            expect(validateValue('12-34', [{ name: 'equals', value: '1234', convert }], ['dep'])).toBeNull();
            expect(convert).toHaveBeenCalledWith('12-34', '1234', ['dep']);
        });

        it('applies an object of converts in order, mixing names and functions', () => {
            const convert = { trim: true, lower: 'yes', exclaim: value => `${value}!` };
            expect(validateValue('  ABC ', [{ name: 'equals', value: 'abc!', convert }])).toBeNull();
        });

        it('skips object converts whose value is falsy', () => {
            expect(validateValue(' a ', [{ name: 'equals', value: ' a ', convert: { trim: false, upper: null } }])).toBeNull();
        });

        it('converts non-string values to strings', () => {
            expect(validateValue(5, [{ name: 'equals', value: '5', convert: 'trim' }])).toBeNull();
            expect(() => validateValue(null, [{ name: 'required', convert: 'trim' }])).not.toThrow();
        });

        it('keeps the converted value for the rules after it', () => {
            const rules = [{ name: 'minLength', value: 1, convert: 'trim' }, 'required'];
            expect(validateValue('   ', rules)).toEqual([error('required')]);
        });
    });
});
