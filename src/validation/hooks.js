import { useState, useEffect, useMemo } from 'react';
import { validateValue, createValidationContext, unique_key } from './context';

const useValueToken = Symbol();

export function useValidationContext() {
    const [key, setKey] = useState(0);

    const [validation] = useState(() => {
        const context = createValidationContext();
        context.key = key;

        return context;
    });

    useEffect(() => {
        const sub = validation.on().subscribe(() => {
            validation.key++;
            if(validation.key > 10000000){
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

export function useValidationValue(value, setValue) {
    return useMemo(() => {
        return {
            value,
            [useValueToken]: setValue
        };
    }, [value, setValue]);
}

export function useValidation(defaultValue, rules, context, deps, enabled) {
    if (typeof deps === "function") {
        enabled = deps;
        deps = undefined;
    }
    let value, setValue;
    let [useValue, setUseValue] = useState(defaultValue);

    if (defaultValue && typeof defaultValue === 'object' && defaultValue[useValueToken]) {
        value = defaultValue.value;
        setValue = defaultValue[useValueToken];
    } else {
        value = useValue;
        setValue = setUseValue;
    }

    const key = useMemo(() => unique_key(), []);
    const control = useMemo(() => ({
        get key() { return key; },
        get value() { return value; },
        get rules() { return rules; },

        validate: sync => {
            if (enabled && !enabled(value)) {
                context.removeResult(key, sync === undefined ? true : sync);
                return;
            }

            const results = validateValue(value, rules);

            if (!results)
                context.removeResult(key, sync === undefined ? true : sync);
            else
                context.addResult({ key, errors: results }, sync === undefined ? true : sync);
        },

        err: (rule, dirty = true) => {
            if (rule === false) {
                rule = undefined;
                dirty = null;
            }

            if (dirty !== null && context.dirty !== dirty) return false;
            return context.hasError(key, rule);
        },

        message: (rule) => {
            return context.getMessage(key, rule);
        }
    }), [value, ...(deps || [])]);

    useEffect(() => {
        control.validate(true);
    }, [control]);

    useEffect(() => {
        return () => {
            context.removeResult(key, false);
        };
    }, []);

    return [value, setValue, control];
}