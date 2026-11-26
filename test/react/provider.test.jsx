import { describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePValidation, usePValidationContext, ValidationProvider } from '../../src/index.js';
import { modes } from './helpers.jsx';

function ProviderField({ label = 'field', rules = ['required'], deps, enabled }) {
    const [value, setValue, ctr, onBlur] = usePValidation('', rules, deps, enabled);

    return (
        <>
            <input aria-label={label} value={value} onChange={event => setValue(event.target.value)} onBlur={onBlur} />
            <span data-testid={`${label}-error`}>{ctr.derr() ? ctr.message() : ''}</span>
        </>
    );
}

function Status({ testId = 'status' }) {
    const ctx = usePValidationContext();
    return <output data-testid={testId}>{ctx.isValid() ? 'valid' : 'invalid'}{ctx.dirty ? ' dirty' : ''}</output>;
}

function SubmitButton() {
    const ctx = usePValidationContext();
    return <button type="button" onClick={() => ctx.setDirty()}>Submit</button>;
}

const text = testId => screen.getByTestId(testId).textContent;

describe.each(modes)('ValidationProvider in $mode', ({ wrapper }) => {
    const setup = ui => ({ user: userEvent.setup(), ...render(ui, { wrapper }) });

    it('shows the form as invalid on the first render', () => {
        setup(
            <ValidationProvider>
                <Status />
                <ProviderField />
            </ValidationProvider>,
        );

        expect(text('status')).toBe('invalid');
    });

    it('updates usePValidationContext consumers as fields change', async () => {
        const { user } = setup(
            <ValidationProvider>
                <Status />
                <ProviderField label="name" />
                <ProviderField label="email" rules={['required', 'email']} />
            </ValidationProvider>,
        );

        await user.type(screen.getByLabelText('name'), 'Ann');
        expect(text('status')).toBe('invalid');

        await user.type(screen.getByLabelText('email'), 'ann@example.com');
        expect(text('status')).toBe('valid');

        await user.clear(screen.getByLabelText('name'));
        expect(text('status')).toBe('invalid');
    });

    it('reveals errors after the form is submitted', async () => {
        const { user } = setup(
            <ValidationProvider>
                <Status />
                <ProviderField />
                <SubmitButton />
            </ValidationProvider>,
        );

        expect(text('field-error')).toBe('');

        await user.click(screen.getByRole('button', { name: 'Submit' }));

        expect(text('status')).toBe('invalid dirty');
        expect(text('field-error')).toBe('required');
    });

    it('supports deps and enabled on usePValidation', () => {
        const { rerender } = setup(
            <ValidationProvider>
                <Status />
                <ProviderField deps={[]} enabled={false} />
            </ValidationProvider>,
        );
        expect(text('status')).toBe('valid');

        rerender(
            <ValidationProvider>
                <Status />
                <ProviderField deps={false} />
            </ValidationProvider>,
        );
        expect(text('status')).toBe('valid');
    });

    it('keeps separate providers independent', async () => {
        const { user } = setup(
            <>
                <ValidationProvider>
                    <Status testId="first" />
                    <ProviderField label="first-field" />
                </ValidationProvider>
                <ValidationProvider>
                    <Status testId="second" />
                </ValidationProvider>
            </>,
        );

        expect(text('first')).toBe('invalid');
        expect(text('second')).toBe('valid');

        await user.type(screen.getByLabelText('first-field'), 'x');
        expect(text('first')).toBe('valid');
    });

    it('still updates the form when a child listener unsubscribes itself during notify', () => {
        let form;

        function OneShotListener() {
            const ctx = usePValidationContext();
            form = ctx;

            useEffect(() => {
                const subscription = ctx.on().subscribe(() => subscription.unsubscribe());
                return () => subscription.unsubscribe();
            }, [ctx]);

            return null;
        }

        setup(
            <ValidationProvider>
                <OneShotListener />
                <Status />
            </ValidationProvider>,
        );
        expect(text('status')).toBe('valid');

        act(() => form.addResult('server', [{ name: 'taken', message: 'Taken' }]));

        expect(text('status')).toBe('invalid');
    });

    it.each([
        ['setDirty', ctx => ctx.setDirty()],
        ['setPristine', ctx => ctx.setPristine()],
        ['addResult with unchanged results', ctx => ctx.addResult('external', [{ name: 'x', message: 'x' }])],
        ['removeResult for a missing key', ctx => ctx.removeResult('missing')],
    ])('a consumer effect that calls %s on every render does not loop', (name, call) => {
        let renders = 0;

        function EffectConsumer() {
            const ctx = usePValidationContext();
            renders++;
            useEffect(() => {
                call(ctx);
            });
            return null;
        }

        setup(
            <ValidationProvider>
                <EffectConsumer />
                <ProviderField />
            </ValidationProvider>,
        );

        expect(renders).toBeLessThan(10);
    });
});
