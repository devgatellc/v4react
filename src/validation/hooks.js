import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { validateValue, createValidationContext, unique_key } from './context';

const useValueToken = Symbol();

export function useValidationContext() {
    const [_, setKey] = useState(0);

    const validation = useMemo(() => {
        const context = createValidationContext();
        context.key = 0;

        return context;
    }, []);

    useEffect(() => {
        const sub = validation.on().subscribe(() => {
            validation.key++;
            if (validation.key > 10000000) {
                validation.key = 0;
            }

            setKey(validation.key);
        });

        return () => {
            sub.unsubscribe();
        };
    }, []);

    return validation;
}

export function useValidationValue(initialValue) {
    const [value, setValue] = useState(initialValue);

    return useMemo(() => {
        return {
            value,
            [useValueToken]: setValue
        };
    }, [value, setValue]);
}

export function useValidation(defaultValue, rules, context, deps, enabled) {
    if (typeof deps === "function" || typeof deps === 'boolean') {
        enabled = deps;
        deps = undefined;
    }

    let value, setValue;
    const [useValue, setUseValue] = useState(defaultValue);

    if (defaultValue && typeof defaultValue === 'object' && defaultValue[useValueToken]) {
        value = defaultValue.value;
        setValue = defaultValue[useValueToken];
    } else {
        value = useValue;
        setValue = setUseValue;
    }

    const isEnabled = enabled === undefined || (typeof enabled === 'function' && !!enabled(value)) || (typeof enabled !== 'function' && !!enabled);
    const [isDirty, setDirty] = useState(false);

    const isDirtyRef = useRef(context.dirty && isEnabled);
    if (isDirty && (!isEnabled || (isDirtyRef.value !== context.dirty && !context.dirty))) setDirty(false);
    isDirtyRef.value = context.dirty && isEnabled;

    const key = useMemo(() => unique_key(), []);
    const control = useMemo(() => ({
        get key() { return key; },
        get value() { return value; },
        get rules() { return rules; },
        get dirty() { return isDirty; },

        validate: () => {
            if (!isEnabled) {
                context.removeResult(key);
                return;
            }

            const results = validateValue(value, rules);

            if (!results)
                context.removeResult(key);
            else
                context.addResult(key, results);
        },

        setDirty: () => {
            setDirty(true);
        },

        setPristine: () => {
            setDirty(false);
        },

        err: (rule) => {
            return context.hasError(key, rule);
        },

        derr: (rule, state) => {
            if (typeof rule === 'boolean') {
                state = rule;
                rule = undefined;
            }

            if (state === undefined) {
                if (!context.dirty) return false;
            } else if (!state) {
                if (!isDirty) return false;
            } else {
                if (!context.dirty && !isDirty) return false;
            }

            return context.hasError(key, rule);
        },

        message: (rule) => {
            return context.getMessage(key, rule);
        }
    }), [value, ...(deps || []), isEnabled, isDirty]);

    useEffect(() => {
        control.validate();
    }, [control]);

    useEffect(() => {
        return () => {
            context.removeResult(key);
        };
    }, []);

    const onBlur = useCallback(() => {
        control.setDirty();
    }, [control]);

    return [value, setValue, control, onBlur];
}