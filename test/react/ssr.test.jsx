import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
    usePValidation,
    usePValidationContext,
    useValidation,
    useValidationContext,
    useValidationValue,
    ValidationProvider,
} from '../../src/index.js';

function Form() {
    const ctx = useValidationContext();
    const [value, , ctr] = useValidation('Ann', ['required'], ctx, [1]);
    return <p>{value}|{String(ctr.dirty)}|{ctx.isValid() ? 'valid' : 'invalid'}</p>;
}

function ProviderField() {
    const ctx = usePValidationContext();
    const [value] = usePValidation('x', ['required']);
    return <i>{value}|{String(ctx.dirty)}</i>;
}

function SharedValue() {
    const ctx = useValidationContext();
    const shared = useValidationValue('shared');
    const [value] = useValidation(shared, ['required'], ctx);
    return <b>{value}</b>;
}

describe('server-side rendering', () => {
    it('renders a form that uses useValidation', () => {
        expect(renderToString(<Form />)).toBe('<p>Ann<!-- -->|<!-- -->false<!-- -->|<!-- -->valid</p>');
    });

    it('renders ValidationProvider with usePValidation and usePValidationContext', () => {
        expect(renderToString(<ValidationProvider><ProviderField /></ValidationProvider>)).toBe('<i>x<!-- -->|<!-- -->false</i>');
    });

    it('renders useValidationValue', () => {
        expect(renderToString(<SharedValue />)).toBe('<b>shared</b>');
    });
});
