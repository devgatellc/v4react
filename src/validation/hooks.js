import { useState, useEffect, useCallback, useMemo } from 'react';
import { validateValue, ValidationContext, unique_key } from './validation';

export function useValidationContext() {
    const [validation, setValidation] = useState(() => {
        let context = new ValidationContext();
        let obj = { controls: {} };

        for (let prop in context)
            obj[prop] = context[prop];

        for (let prop of Object.getOwnPropertyNames(Object.getPrototypeOf(context))) {
            if (prop === 'constructor') continue;
            if (typeof context[prop] === 'function')
                obj[prop] = context[prop].bind(obj);
        }

        obj.on().subscribe(() => setValidation({ ...validation }));

        return obj;
    });

    return validation;
}

export function useValidation(defaultValue, rules, context, deps, enabled) {
    if (typeof deps === "function") {
        enabled = deps;
        deps = undefined;
    }
    let [value, setValue] = useState(defaultValue);

    let key = useMemo(() => unique_key(), []);
    let isDirty = useCallback(() => context.results.find(x => x.key === key)?.dirty, []);

    let control = useMemo(() => ({
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

    let groupKey = useMemo(() => unique_key(), []);
    let controls = useMemo(() => {
        let controls = (values || []).map(value => {
            let key = keyfn(value);
            let isDirty = () => context.results.find(x => x.key === key)?.dirty;

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

    for (let control of controls) {
        context.controls[control.key] = control;
    }

    useEffect(() => {
        for (let prop in context.controls) {
            if (context.controls[prop].group !== groupKey) continue;
            if (controls.find(x => x.key === prop)) continue;

            context.removeResult(context.controls[prop].key, false);
            delete context.controls[prop];
        }

        for (let prop in context.controls) {
            if (context.controls[prop].group !== groupKey) continue;
            context.controls[prop].validate(true, false);
        }
    }, [values, ...(deps || [])]);

    useEffect(() => {
        return () => {
            for (let prop in context.controls) {
                if (context.controls[prop].group !== groupKey) continue;
    
                context.removeResult(context.controls[prop].key, false);
                delete context.controls[prop];
            }
        };
    }, []);

    return [values, setValues, controls];
}