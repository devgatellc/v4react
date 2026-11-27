import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateValue, validationConfig } from '../../src/index.js';

let savedValidators;
let savedConverts;

beforeEach(() => {
    savedValidators = { ...validationConfig.validators };
    savedConverts = { ...validationConfig.converts };
});

afterEach(() => {
    for (const name of Object.keys(validationConfig.validators)) {
        if (!(name in savedValidators)) delete validationConfig.validators[name];
    }
    for (const name of Object.keys(validationConfig.converts)) {
        if (!(name in savedConverts)) delete validationConfig.converts[name];
    }
    validationConfig.validators = savedValidators;
    validationConfig.converts = savedConverts;
});

describe('validationConfig', () => {
    it('exposes the built-in validators', () => {
        expect(Object.keys(validationConfig.validators).sort()).toEqual([
            'email', 'equals', 'integer', 'max', 'maxLength', 'min', 'minLength',
            'number', 'pattern', 'requireChecked', 'required', 'requiredIf', 'url',
        ]);
    });

    it('exposes the built-in converts', () => {
        expect(Object.keys(validationConfig.converts).sort()).toEqual(['lower', 'trim', 'upper']);
        expect(validationConfig.converts.trim('  a ')).toBe('a');
        expect(validationConfig.converts.upper('ab')).toBe('AB');
        expect(validationConfig.converts.lower('AB')).toBe('ab');
        expect(validationConfig.converts.upper(5)).toBe('5');
    });

    it('built-in converts return empty values unchanged', () => {
        for (const name of ['trim', 'upper', 'lower']) {
            expect(validationConfig.converts[name]('')).toBe('');
            expect(validationConfig.converts[name](null)).toBeNull();
            expect(validationConfig.converts[name](undefined)).toBeUndefined();
            expect(validationConfig.converts[name](NaN)).toBeNaN();
        }
    });

    it('min and max reuse the configured number validator', () => {
        expect(validationConfig.validators.min(5, 3)).toBe(true);
        expect(validationConfig.validators.max(1, 3)).toBe(true);

        validationConfig.validators = { number: () => false };

        expect(validationConfig.validators.min(5, 3)).toBe(false);
        expect(validationConfig.validators.max(1, 3)).toBe(false);
    });

    it('adds validators without removing the built-ins', () => {
        validationConfig.validators = { startsUpper: value => !value || /^[A-Z]/.test(value) };

        expect(validationConfig.validators.startsUpper).toBeTypeOf('function');
        expect(validationConfig.validators.required).toBeTypeOf('function');
        expect(validateValue('abc', ['startsUpper'])).toEqual([{ name: 'startsUpper', message: 'startsUpper' }]);
        expect(validateValue('Abc', ['startsUpper'])).toBeNull();
    });

    it('passes the rule value and deps to a registered validator', () => {
        validationConfig.validators = { between: (value, [low, high], deps) => value >= low && value <= high && deps.length === 1 };

        expect(validateValue(5, [{ name: 'between', value: [1, 10] }], ['dep'])).toBeNull();
        expect(validateValue(50, [{ name: 'between', value: [1, 10] }], ['dep'])).not.toBeNull();
    });

    it('replaces a built-in validator', () => {
        validationConfig.validators = { required: value => value !== undefined };

        expect(validateValue('', ['required'])).toBeNull();
        expect(validateValue(undefined, ['required'])).not.toBeNull();
    });

    it('adds converts without removing the built-ins', () => {
        validationConfig.converts = { digits: value => String(value).replace(/\D/g, '') };

        expect(validationConfig.converts.trim).toBeTypeOf('function');
        expect(validateValue('(555) 12-34', [{ name: 'equals', value: '5551234', convert: 'digits' }])).toBeNull();
    });
});
