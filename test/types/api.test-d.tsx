import type { ReactElement } from 'react';
import { describe, expectTypeOf, test } from 'vitest';
import {
    createValidationContext,
    usePValidation,
    usePValidationContext,
    useValidation,
    useValidationContext,
    useValidationValue,
    validateValue,
    validationConfig,
    ValidationProvider,
    type ValidationContext,
    type ValidationControl,
    type ValidationConverter,
    type ValidationResult,
    type ValidationRule,
    type ValidationValidator,
    type ValidationValue,
} from 'v4react';

const ctx = createValidationContext();

describe('exports', () => {
    test('context factories return ValidationContext', () => {
        expectTypeOf(createValidationContext).returns.toEqualTypeOf<ValidationContext>();
        expectTypeOf(useValidationContext).returns.toEqualTypeOf<ValidationContext>();
        expectTypeOf(usePValidationContext).returns.toEqualTypeOf<ValidationContext>();
    });

    test('validateValue returns results or null', () => {
        expectTypeOf(validateValue('x', ['required'])).toEqualTypeOf<ValidationResult[] | null>();
        expectTypeOf(validateValue).toBeCallableWith('x', ['required'], ['dep']);
    });
});

describe('useValidation', () => {
    test('infers the value type and returns a typed tuple', () => {
        const [value, setValue, control, onBlur] = useValidation(5, ['required'], ctx);

        expectTypeOf(value).toEqualTypeOf<number>();
        expectTypeOf(setValue).parameter(0).toEqualTypeOf<number | ((prevState: number) => number)>();
        expectTypeOf(control).toEqualTypeOf<ValidationControl<number>>();
        expectTypeOf(onBlur).toEqualTypeOf<() => void>();
    });

    test('accepts a lazy initial value', () => {
        const [value] = useValidation(() => 'lazy', [], ctx);
        expectTypeOf(value).toEqualTypeOf<string>();
    });

    test('accepts deps, enabled, or both', () => {
        expectTypeOf(useValidation<string>).toBeCallableWith('', [], ctx, ['dep']);
        expectTypeOf(useValidation<string>).toBeCallableWith('', [], ctx, true);
        expectTypeOf(useValidation<string>).toBeCallableWith('', [], ctx, (value: string) => value.length > 0);
        expectTypeOf(useValidation<string>).toBeCallableWith('', [], ctx, ['dep'], false);
        expectTypeOf(useValidation<string>).toBeCallableWith('', [], ctx, undefined, (value: string) => value !== '');
    });

    test('usePValidation mirrors useValidation without the context argument', () => {
        const [value, , control] = usePValidation('text', ['required'], ['dep'], true);

        expectTypeOf(value).toEqualTypeOf<string>();
        expectTypeOf(control).toEqualTypeOf<ValidationControl<string>>();
    });

    test('useValidationValue wraps the value', () => {
        expectTypeOf(useValidationValue(1)).toEqualTypeOf<ValidationValue<number>>();
        expectTypeOf(useValidationValue(1).value).toEqualTypeOf<number>();
    });

    test('a useValidationValue result gives the hooks its own value type', () => {
        const min = useValidationValue('');
        const [minValue, setMin, minControl] = useValidation(min, ['number'], ctx, [min.value]);
        const [pValue, setP, pControl] = usePValidation(min, ['number']);

        const text: string = minValue;
        setMin('5');
        setP(prev => prev + '5');

        expectTypeOf(text).toEqualTypeOf<string>();
        expectTypeOf(minControl).toEqualTypeOf<ValidationControl<string>>();
        expectTypeOf(pValue).toEqualTypeOf<string>();
        expectTypeOf(pControl).toEqualTypeOf<ValidationControl<string>>();
    });

    test('a plain { value } object is an ordinary initial value', () => {
        const [value] = useValidation({ value: 1 }, [], ctx);

        expectTypeOf(value).toEqualTypeOf<{ value: number }>();
    });
});

describe('ValidationControl', () => {
    const [, , control] = useValidation('', ['required'], ctx);

    test('err and derr are typed as boolean', () => {
        expectTypeOf(control.err()).toEqualTypeOf<boolean>();
        expectTypeOf(control.err('required')).toEqualTypeOf<boolean>();
        expectTypeOf(control.derr()).toEqualTypeOf<boolean>();
        expectTypeOf(control.derr).toBeCallableWith('required', true);
        expectTypeOf(control.derr).toBeCallableWith(true);
    });

    test('message takes an optional rule', () => {
        expectTypeOf(control.message).toBeCallableWith();
        expectTypeOf(control.message).toBeCallableWith('required');
        expectTypeOf(control.message()).toEqualTypeOf<string>();
    });

    test('exposes key, value, rules and dirty', () => {
        expectTypeOf(control.key).toEqualTypeOf<string>();
        expectTypeOf(control.value).toEqualTypeOf<string>();
        expectTypeOf(control.rules).toEqualTypeOf<ValidationRule[]>();
        expectTypeOf(control.dirty).toEqualTypeOf<boolean>();
    });
});

describe('ValidationContext', () => {
    test('key is a number', () => {
        expectTypeOf(ctx.key).toEqualTypeOf<number>();
    });

    test('subscribe is spelled correctly and receives the key', () => {
        expectTypeOf(ctx.on()).toHaveProperty('subscribe');
        expectTypeOf(ctx.on()).not.toHaveProperty('subscrube');
        expectTypeOf(ctx.on('a').subscribe).parameter(0).toEqualTypeOf<(key: string) => void>();
        expectTypeOf(ctx.on().subscribe(() => {}).unsubscribe).toEqualTypeOf<() => void>();
    });

    test('addResult and removeResult are declared and chainable', () => {
        expectTypeOf(ctx.addResult('a', [{ name: 'x', message: 'y' }])).toEqualTypeOf<ValidationContext>();
        expectTypeOf(ctx.removeResult('a')).toEqualTypeOf<ValidationContext>();
        expectTypeOf(ctx.setDirty()).toEqualTypeOf<ValidationContext>();
        expectTypeOf(ctx.setPristine()).toEqualTypeOf<ValidationContext>();
    });

    test('getState always has valid and errors', () => {
        const state = ctx.getState('a');

        expectTypeOf(state.valid).toEqualTypeOf<boolean>();
        expectTypeOf(state.errors).toEqualTypeOf<{ [prop: string]: { message: string } }>();
    });

    test('a real context satisfies the interface, so it can replace hand-written mocks', () => {
        expectTypeOf(createValidationContext()).toExtend<ValidationContext>();
    });
});

describe('ValidationProvider', () => {
    test('accepts children and extra props', () => {
        expectTypeOf(<ValidationProvider><span /></ValidationProvider>).toExtend<ReactElement>();
        expectTypeOf(<ValidationProvider className="form" id="main" />).toExtend<ReactElement>();
    });
});

describe('rules', () => {
    test('accepts every rule shape', () => {
        const rules: ValidationRule[] = [
            'required',
            { name: 'min', value: 3, message: 'Too small' },
            { name: 'equals', value: (deps: any[]) => deps[0] },
            { name: 'custom', validator: (value, ruleValue, deps) => value === ruleValue && !!deps, convert: 'trim' },
            { name: 'mapped', convert: { trim: true, digits: value => String(value).replace(/\D/g, '') } },
            { name: 'readme', value: 'abc', convert: { trim: true, lower: true } },
            { name: 'converted', convert: value => value },
        ];

        expectTypeOf(rules).toEqualTypeOf<ValidationRule[]>();
    });

    test('a convert map does not take converter names as values', () => {
        const rules: ValidationRule[] = [
            // @ts-expect-error
            { name: 'equals', convert: { trim: 'upper' } },
        ];

        expectTypeOf(rules).toEqualTypeOf<ValidationRule[]>();
    });
});

describe('validationConfig', () => {
    test('built-in validators keep their own signatures', () => {
        expectTypeOf(validationConfig.validators.required).toEqualTypeOf<(value: any) => boolean>();
        expectTypeOf(validationConfig.validators.minLength).parameter(1).toEqualTypeOf<number>();
        expectTypeOf(validationConfig.validators.pattern).parameter(1).toEqualTypeOf<string | RegExp | { pattern: string, flags?: string }>();
        expectTypeOf(validationConfig.converts.trim).returns.toEqualTypeOf<string>();
    });

    test('custom validators and converts are typed', () => {
        expectTypeOf(validationConfig.validators.anyCustomName).toEqualTypeOf<ValidationValidator>();
        expectTypeOf(validationConfig.converts.anyCustomName).toEqualTypeOf<ValidationConverter>();
    });

    test('accepts partial sets of validators and converts', () => {
        validationConfig.validators = { startsUpper: value => /^[A-Z]/.test(value) };
        validationConfig.converts = { digits: value => String(value).replace(/\D/g, '') };
    });

    test('a validator must be a function that returns a boolean', () => {
        expectTypeOf<(value: any, ruleValue?: any, deps?: any[]) => boolean>().toExtend<ValidationValidator>();
        expectTypeOf<(value: any) => string>().not.toExtend<ValidationValidator>();
        expectTypeOf<number>().not.toExtend<ValidationValidator>();
        expectTypeOf<string>().not.toExtend<ValidationConverter>();
    });
});
