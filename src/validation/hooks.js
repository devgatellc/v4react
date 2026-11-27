import { useState, useEffect, useInsertionEffect, useMemo, useRef, useCallback, useId, useSyncExternalStore } from 'react';
import { validateValue, createValidationContext, resetCount } from './context.js';
import { useStableDeps } from './deps.js';

const useValueToken = Symbol();

export function useValidationContext() {
    const validation = useMemo(() => createValidationContext(), []);

    const subscribe = useCallback((onChange) => {
        const sub = validation.on().subscribe(onChange);

        return () => {
            sub.unsubscribe();
        };
    }, [validation]);

    const getKey = useCallback(() => validation.key, [validation]);

    useSyncExternalStore(subscribe, getKey, getKey);

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

export function useValidation(defaultValue, rules, context, depsOrEnabled, enabledArg) {
    if (!context) throw new Error('useValidation needs a validation context as its third argument: pass the one returned by useValidationContext().');

    const depsIsEnabled = typeof depsOrEnabled === "function" || typeof depsOrEnabled === 'boolean';
    const deps = depsIsEnabled ? undefined : depsOrEnabled;
    const enabled = depsIsEnabled ? depsOrEnabled : enabledArg;

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
    const [dirtyAt, setDirtyAt] = useState(null);

    if (dirtyAt !== null && !isEnabled) setDirtyAt(null);
    const isDirty = isEnabled && dirtyAt !== null && dirtyAt === context[resetCount];

    const stableDeps = useStableDeps(deps);

    const rulesRef = useRef(rules);
    useInsertionEffect(() => {
        rulesRef.current = rules;
    });

    const key = useId();
    const control = useMemo(() => {
        const isFieldDirty = () => isDirty && dirtyAt === context[resetCount];

        return {
            get key() { return key; },
            get value() { return value; },
            get rules() { return rulesRef.current; },
            get dirty() { return isFieldDirty(); },

            validate: () => {
                if (!isEnabled) {
                    context.removeResult(key);
                    return;
                }

                const results = validateValue(value, rulesRef.current, stableDeps.deps);

                if (!results)
                    context.removeResult(key);
                else
                    context.addResult(key, results);
            },

            setDirty: () => {
                setDirtyAt(context[resetCount]);
            },

            setPristine: () => {
                setDirtyAt(null);
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
                    if (!isFieldDirty()) return false;
                } else {
                    if (!context.dirty && !isFieldDirty()) return false;
                }

                return context.hasError(key, rule);
            },

            message: (rule) => {
                return context.getMessage(key, rule);
            }
        };
    }, [value, stableDeps, isEnabled, isDirty, dirtyAt, context, key]);

    useEffect(() => {
        control.validate();
    }, [control]);

    useEffect(() => {
        return () => {
            context.removeResult(key);
        };
    }, [context, key]);

    const onBlur = useCallback(() => {
        control.setDirty();
    }, [control]);

    return [value, setValue, control, onBlur];
}