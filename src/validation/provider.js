import React, { createContext, useContext } from 'react';
import { useValidationContext, useValidation } from './hooks';


const ValidationProviderContext = createContext();
const ValidationProviderContextKey = createContext();

export function usePValidationContext() {
    return useContext(ValidationProviderContext);
}

export function usePValidation(defaultValue, rules, deps, enabled) {
    const context = usePValidationContext();
    useContext(ValidationProviderContextKey);

    return useValidation(defaultValue, rules, context, deps, enabled);
}

export function ValidationProvider(props) {
    const context = useValidationContext();

    return React.createElement(ValidationProviderContext.Provider, {value: context}, 
        React.createElement(ValidationProviderContextKey.Provider, {value: context.key}, props.children)
    );
}