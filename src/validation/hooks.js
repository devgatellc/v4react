import { useState, useEffect, useCallback, useMemo } from 'react';
import { validateValue, ValidationContext, unique_key } from './validation';

export const useValueToken = Symbol();

export function useValidationContext() {
    const [validation, setValidation] = useState(() => {
        const context = new ValidationContext();
        context.controls = {};

        context.on().subscribe(() => setValidation({ ...validation }));

        return context;
    });

    useEffect(() => {
        return () => {
            validation.results = [];
            validation.events = [];
            validation.eventCache = [];
            validation.controls = {};
        };
    }, []);

    return validation;
}

export function useValidation(defaultValue, rules, context, deps, enabled) {
    if (typeof deps === "function") {
        enabled = deps;
        deps = undefined;
    }

    let [value, setValue] = useState(defaultValue);
    if (typeof defaultValue === 'object' && defaultValue[useValueToken] &&
        'value' in defaultValue && 'setValue' in defaultValue) {
        value = defaultValue.value;
        setValue = defaultValue.setValue;
    }

    const key = useMemo(() => unique_key(), []);
    const isDirty = useCallback(() => context.results.find(x => x.key === key)?.dirty, []);

    const control = useMemo(() => ({
        get key() { return key; },
        get value() { return value; },
        get rules() { return rules; },
        get dirty() { return isDirty(); },

        validate: (dirty, sync) => {
            if (dirty === undefined) dirty = isDirty();

            if (enabled && !enabled(value)) {
                context.removeResult(key, sync === undefined ? true : sync);
                return;
            }

            const results = validateValue(value, rules);

            if (!results)
                context.removeResult(key, sync === undefined ? true : sync);
            else
                context.addResult({ key, errors: results, dirty }, sync === undefined ? true : sync);
        },

        err: (rule, dirty, contextDirty = true) => {
            if (contextDirty !== null && context.dirty !== contextDirty) return false;
            return context.hasError(key, rule, dirty);
        },

        message: (rule) => {
            return context.getMessage(key, rule);
        }
    }), [value, context, ...(deps || [])]);

    context.controls[key] = control;

    useEffect(() => {
        context.controls[key].validate(true, true);
    }, [value, ...(deps || [])]);

    useEffect(() => {
        return () => {
            context.removeResult(key, false);
            delete context.controls[key];
        };
    }, []);

    return [value, setValue, control];
}

export function useValidationArray(defaultValue, keyfn, rules, context, deps, enabled) {
    if (typeof deps === "function") {
        enabled = deps;
        deps = undefined;
    }

    let [values, setValues] = useState(defaultValue);
    if (typeof defaultValue === 'object' && defaultValue[useValueToken] &&
        'value' in defaultValue && 'setValue' in defaultValue) {
        values = defaultValue.value;
        setValues = defaultValue.setValue;
    }

    const groupKey = useMemo(() => unique_key(), []);
    const controls = useMemo(() => {
        const controls = (values || []).map(value => {
            const key = keyfn(value);
            const isDirty = () => context.results.find(x => x.key === key)?.dirty;

            return {
                get group() { return groupKey; },
                get key() { return key; },

                get value() { return value; },
                get rules() { return rules; },
                get dirty() { return isDirty(); },

                validate: (dirty, sync) => {
                    if (dirty === undefined) dirty = isDirty();

                    if (enabled && !enabled(value)) {
                        context.removeResult(key, sync === undefined ? true : sync);
                        return;
                    }

                    const results = validateValue(value, rules);

                    if (!results)
                        context.removeResult(key, sync === undefined ? true : sync);
                    else
                        context.addResult({ key, errors: results, dirty }, sync === undefined ? true : sync);
                },

                err: (rule, dirty, contextDirty = true) => {
                    if (contextDirty !== null && context.dirty !== contextDirty) return false;
                    return context.hasError(key, rule, dirty);
                },

                message: (rule) => {
                    return context.getMessage(key, rule);
                }
            };
        });

        return controls;
    }, [values, context, ...(deps || [])]);

    for (const control of controls) {
        context.controls[control.key] = control;
    }

    useEffect(() => {
        for (const prop in context.controls) {
            if (context.controls[prop].group !== groupKey) continue;
            if (controls.find(x => x.key === prop)) continue;

            context.removeResult(context.controls[prop].key, false);
            delete context.controls[prop];
        }

        for (const prop in context.controls) {
            if (context.controls[prop].group !== groupKey) continue;
            context.controls[prop].validate(true, false);
        }
    }, [values, ...(deps || [])]);

    useEffect(() => {
        return () => {
            for (const prop in context.controls) {
                if (context.controls[prop].group !== groupKey) continue;

                context.removeResult(context.controls[prop].key, false);
                delete context.controls[prop];
            }
        };
    }, []);

    return [values, setValues, controls];
}