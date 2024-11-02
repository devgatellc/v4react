import * as React from 'react';

declare module 'v4react' {
    export const validationConfig: ValidationConfig;
    export function validateValue(value: any, rules: ValidationRule[]): { name: string, message: string }[] | null;
    export function createValidationContext(): ValidationContext;
    export function useValidationContext(): ValidationContext;
    export function useValidationValue<S>(defaultValue: S | (() => S)): { value: S };
    export function useValidation<S>(defaultValue: S | (() => S), rules: ValidationRule[], context: ValidationContext, deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
        [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>, () => void];

    export function ValidationProvider(props: any): React.FunctionComponentElement<React.ProviderProps<any>>;
    export function usePValidationContext(): ValidationContext;
    export function usePValidation<S>(defaultValue: S | (() => S), rules: ValidationRule[], deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
        [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>, () => void];


    export interface ValidationContext {
        readonly key: number; // Validation context is immutable. Use key to trigger validation of memoized children
        readonly dirty: boolean;
        setDirty: () => ValidationContext;
        setPristine: () => ValidationContext;
        on: (key?: string) => { subscrube: () => { unsubscribe: () => void } };
        notify: (key?: string) => void;
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

    export type ValidationConvert = string | ((value: any, ruleValue?: any) => any) | { [prop: string]: string | ((value: any, ruleValue?: any) => any) };

    export type ValidationRule = string | { name: string; value?: any; message?: string; validator?: (value: any, ruleValue?: any) => boolean; convert?: ValidationConvert };

    export interface ValidationControl<S> {
        readonly key: string;
        readonly value: S;
        readonly rules: ValidationRule[];
        readonly dirty: boolean;
        validate: () => void;
        setDirty: () => void;
        setPristine: () => void;
        err: (rule?: string) => boolean;
        derr: (rule?: string | boolean, type?: boolean) => boolean;
        message: (rule: string) => string
    }
}