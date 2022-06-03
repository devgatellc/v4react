import { useState, useEffect, useCallback, useMemo } from 'react';
import { validateValue, ValidationContext, unique_key } from './validation';

const useValueToken = Symbol();

export function useValidationContext() {
    const [validation, setValidation] = useState(() => {
        const context = new ValidationContext();
        const obj = { controls: {} };

        for (const prop in context)
            obj[prop] = context[prop];

        for (const prop of Object.getOwnPropertyNames(Object.getPrototypeOf(context))) {
            if (prop === 'constructor') continue;
            if (typeof context[prop] === 'function')
                obj[prop] = context[prop].bind(obj);
        }

        obj.on().subscribe(() => setValidation({ ...validation }));

        return obj;
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

export function toValidationValue(value, setValue) {
    return {
        value,
        [useValueToken]: setValue
    };
}

export function useValidationValue(defaultValue) {
    let [value, setValue] = useState(defaultValue);
    return toValidationValue(value, setValue);
}

export function useValidation(defaultValue, rules, context, deps, enabled) {
    if (typeof deps === "function") {
        enabled = deps;
        deps = undefined;
    }
    let value, setValue;
    let [useValue, setUseValue] = useState(defaultValue);
    if (defaultValue && typeof defaultValue === 'object' && defaultValue[useValueToken]) {
        value = useValue.value;
        setValue = value => {
            useValue[useValueToken](value);
            useValue.value = value;
            setUseValue({ ...useValue });
        };
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
    }), [value, context, ...(deps || [])]);

    context.controls[key] = control;

    useEffect(() => {
        context.controls[key].validate(true);
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

    let values, setValues;
    let [useValue, setUseValue] = useState(defaultValue);
    if (defaultValue && typeof defaultValue === 'object' && defaultValue[useValueToken]) {
        values = useValue.value;
        setValues = value => {
            useValue[useValueToken](value);
            useValue.value = value;
            setUseValue({ ...useValue });
        };
    } else {
        values = useValue;
        setValues = setUseValue;
    }

    const groupKey = useMemo(() => unique_key(), []);
    const controls = useMemo(() => {
        const controls = (values || []).map(value => {
            const key = keyfn(value);

            return {
                get group() { return groupKey; },
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
            context.controls[prop].validate(false);
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