import { createContext, useContext } from 'react';
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

export function ValidationProvider({ children }) {
    const context = useValidationContext();

    return (
        <ValidationProviderContext.Provider value={context}>
            <ValidationProviderContextKey.Provider value={context.key}>
                {children}
            </ValidationProviderContextKey.Provider>
        </ValidationProviderContext.Provider>
    );
}