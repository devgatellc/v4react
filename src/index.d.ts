import * as React from 'react';

export const validationConfig: ValidationConfig;
export function validateValue(value: any, rules: ValidationRule[], deps?: any[]): ValidationResult[] | null;
export function createValidationContext(): ValidationContext;
export function useValidationContext(): ValidationContext;
export function useValidationValue<S>(defaultValue: S | (() => S)): ValidationValue<S>;
export function useValidation<S>(defaultValue: Extract<S, null | undefined>, rules: ValidationRule[], context: ValidationContext, deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
    [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>, () => void];
export function useValidation<S>(defaultValue: ValidationValue<S>, rules: ValidationRule[], context: ValidationContext, deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
    [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>, () => void];
export function useValidation<S>(defaultValue: S | (() => S), rules: ValidationRule[], context: ValidationContext, deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
    [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>, () => void];

export function ValidationProvider(props: { children?: React.ReactNode; [prop: string]: any }): React.ReactElement;
export function usePValidationContext(): ValidationContext;
export function usePValidation<S>(defaultValue: Extract<S, null | undefined>, rules: ValidationRule[], deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
    [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>, () => void];
export function usePValidation<S>(defaultValue: ValidationValue<S>, rules: ValidationRule[], deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
    [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>, () => void];
export function usePValidation<S>(defaultValue: S | (() => S), rules: ValidationRule[], deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)):
    [S, (val: S | ((prevState: S) => S)) => void, ValidationControl<S>, () => void];

declare const validationValueBrand: unique symbol;

export interface ValidationValue<S> {
    readonly value: S;
    readonly [validationValueBrand]: true;
}

export interface ValidationResult {
    name: string;
    message: string;
}

export interface ValidationSubscription {
    unsubscribe: () => void;
}

export interface ValidationContext {
    readonly key: number; // Validation context is immutable. Use key to trigger validation of memoized children
    readonly dirty: boolean;
    setDirty: () => ValidationContext;
    setPristine: () => ValidationContext;
    addResult: (key: string, results: ValidationResult[] | null | undefined) => ValidationContext;
    removeResult: (key: string) => ValidationContext;
    on: (key?: string) => { subscribe: (fn: (key: string) => void) => ValidationSubscription };
    notify: (key?: string) => void;
    getState: (key: string) => { valid: boolean; errors: { [prop: string]: { message: string } } };
    getMessage: (key: string, rule?: string) => string;
    hasError: (key: string, rule?: string) => boolean;
    isValid: () => boolean;
}

export type ValidationValidator = (value: any, ruleValue?: any, deps?: any[]) => boolean;

export type ValidationConverter = (value: any, ruleValue?: any, deps?: any[]) => any;

export interface ValidationValidators {
    required: (value: any) => boolean;
    requiredIf: (value: any, ifCase: boolean) => boolean;
    requireChecked: (value: any) => boolean;
    number: (value: any) => boolean;
    integer: (value: any) => boolean;
    min: (value: any, min: number) => boolean;
    max: (value: any, max: number) => boolean;
    minLength: (value: any, length: number) => boolean;
    maxLength: (value: any, length: number) => boolean;
    equals: (value: any, equalValue: any) => boolean;
    pattern: (value: any, pattern: string | RegExp | { pattern: string, flags?: string } | null | undefined | false) => boolean;
    email: (value: any) => boolean;
    url: (value: any) => boolean;
    [name: string]: ValidationValidator;
}

export interface ValidationConverters {
    trim: (value: any) => string;
    upper: (value: any) => string;
    lower: (value: any) => string;
    [name: string]: ValidationConverter;
}

export interface ValidationConfig {
    get validators(): ValidationValidators;
    set validators(validators: { [name: string]: ValidationValidator });

    get converts(): ValidationConverters;
    set converts(converts: { [name: string]: ValidationConverter });
}

export type ValidationConvert = string | ValidationConverter | { [prop: string]: boolean | ValidationConverter };

export type ValidationRule = string | { name: string; value?: any; message?: string; validator?: ValidationValidator; convert?: ValidationConvert };

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
    message: (rule?: string) => string;
}

export {};
