import * as React from 'react';

declare module 'v4react' {
    export const validationConfig: ValidationConfig;
    export function validateValue(value: any, rules: Rule[]): { name: string, message: string }[] | null;
    export function createValidationContext(): ValidationContext;
    export function useValidationContext(): ValidationContext;
    export function useValidationValue<S>(defaultValue: S | (() => S)): { value: S };
    export function useValidation<S>(defaultValue: S | (() => S), rules: Rule[], context: ValidationContext, deps?: any[] | boolean  | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
        [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>];

    export function ValidationProvider(props: any): React.FunctionComponentElement<React.ProviderProps<any>>;
    export function usePValidationContext(): ValidationContext;
    export function usePValidation<S>(defaultValue: S | (() => S), rules: Rule[], deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
        [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>];


    export interface ValidationContext {
        dirty: boolean;
        on: (key?: string) => { subscrube: () => { unsubscribe: () => void } };
        notify: (key?: string) => void;
        setDirty: () => ValidationContext;
        setPristine: () => ValidationContext;
        getState: (key: string) => { valid: boolean; errors: { [prop: string]: { message: string } } };
        getMessage: (key: string, rule?: string) => string;
        hasError: (key: string, rule?: string) => boolean;
        isValid: () => boolean;
    }

    export interface ValidationConfig {
        validators: {
            required: (value: any) => boolean,
            requiredIf: (value: any, ifCase: boolean) => boolean,
            requireChecked: (value: any) => boolean,
            number: (value: any) => boolean,
            integer: (value: any) => boolean,
            min: (value: any, min: number) => boolean,
            max: (value: any, max: number) => boolean,
            minLength: (value: any, length: number) => boolean,
            maxLength: (value: any, length: number) => boolean,
            equals: (value: any, equalValue: any) => boolean,
            pattern: (value: any, pattern: string | { pattern: string, flags: string }) => boolean,
            email: (value: any) => boolean,
            url: (value: any) => boolean
        } | any;

        converts: {
            trim: (value: any) => string,
            upper: (value: any) => string,
            lower: (value: any) => string
        } | any;
    }

    export type Rule = string | { name: string; value?: any; message?: string; validator?: (...args: any[]) => boolean; convert?: any };

    export interface ValidationControl<S> {
        key: string; 
        value: S; 
        rules: Rule[]; 
        validate: () => void; 
        err: (rule?: string | false) => boolean; 
        message: (rule: string)=> string
    }
}