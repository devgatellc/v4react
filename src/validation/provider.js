import React, { createContext, useContext } from 'react';
import { useValidationContext, useValidation } from './hooks.js';


const ValidationProviderContext = createContext();
const ValidationProviderContextKey = createContext();

export function usePValidationContext() {
    useContext(ValidationProviderContextKey);

    return useContext(ValidationProviderContext);
}

export function usePValidation(defaultValue, rules, deps, enabled) {
    const context = usePValidationContext();
    if (!context) throw new Error('usePValidation must be used inside a ValidationProvider.');

    return useValidation(defaultValue, rules, context, deps, enabled);
}

export function ValidationProvider(props) {
    const context = useValidationContext();

    return React.createElement(ValidationProviderContext.Provider, { value: context },
        React.createElement(ValidationProviderContextKey.Provider, { value: context.key }, props.children)
    );
}