import { describe, expectTypeOf, test } from 'vitest';
import { createValidationContext, usePValidation, useValidation, useValidationValue } from 'v4react';

const ctx = createValidationContext();

describe('without strictNullChecks', () => {
    test('a null or undefined initial value gives any', () => {
        const [fromNull] = useValidation(null, [], ctx);
        const [fromUndefined] = useValidation(undefined, [], ctx);
        const [pFromNull] = usePValidation(null, []);
        const [pFromUndefined] = usePValidation(undefined, []);

        expectTypeOf(fromNull).toBeAny();
        expectTypeOf(fromUndefined).toBeAny();
        expectTypeOf(pFromNull).toBeAny();
        expectTypeOf(pFromUndefined).toBeAny();
    });

    test('a type argument still applies to a null initial value', () => {
        const [date] = useValidation<Date>(null, [], ctx);
        const [pDate] = usePValidation<Date>(null, []);

        expectTypeOf(date).toEqualTypeOf<Date>();
        expectTypeOf(pDate).toEqualTypeOf<Date>();
    });

    test('other initial values keep their own types', () => {
        const min = useValidationValue('');

        expectTypeOf(useValidation(5, [], ctx)[0]).toEqualTypeOf<number>();
        expectTypeOf(useValidation(min, [], ctx)[0]).toEqualTypeOf<string>();
        expectTypeOf(usePValidation(min, [])[0]).toEqualTypeOf<string>();
    });
});
