import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createValidationContext, useValidation, useValidationContext, useValidationValue } from '../../src/index.js';
import { modes } from './helpers.jsx';

function Field({ rules = ['required'], initial = '', probe = {} }) {
    const ctx = useValidationContext();
    const [value, setValue, ctr, onBlur] = useValidation(initial, rules, ctx);
    Object.assign(probe, { ctx, ctr, setValue, value });

    return (
        <>
            <input aria-label="field" value={value} onChange={event => setValue(event.target.value)} onBlur={onBlur} />
            <output data-testid="status">{ctx.isValid() ? 'valid' : 'invalid'}</output>
            <output data-testid="error">{ctr.derr() ? ctr.message() : ''}</output>
        </>
    );
}

function ChildField({ ctx, label, rules = ['required'] }) {
    const [value, setValue, , onBlur] = useValidation('', rules, ctx);
    return <input aria-label={label} value={value} onChange={event => setValue(event.target.value)} onBlur={onBlur} />;
}

function ParentForm({ showChild = true, probe = {} }) {
    const ctx = useValidationContext();
    probe.ctx = ctx;

    return (
        <>
            {showChild && <ChildField ctx={ctx} label="name" />}
            <ChildField ctx={ctx} label="email" rules={['required', 'email']} />
            <output data-testid="status">{ctx.isValid() ? 'valid' : 'invalid'}</output>
        </>
    );
}

const status = () => screen.getByTestId('status').textContent;
const shownError = () => screen.getByTestId('error').textContent;

describe.each(modes)('useValidation in $mode', ({ wrapper }) => {
    const setup = ui => ({ user: userEvent.setup(), ...render(ui, { wrapper }) });

    describe('validation', () => {
        it('validates on the first render', () => {
            const probe = {};
            setup(<Field probe={probe} />);

            expect(status()).toBe('invalid');
            expect(probe.ctx.isValid()).toBe(false);
            expect(probe.ctr.err()).toBe(true);
            expect(probe.ctr.err('required')).toEqual({ message: 'required' });
        });

        it('becomes valid as the user types and invalid again when cleared', async () => {
            const { user } = setup(<Field />);
            const input = screen.getByRole('textbox');

            await user.type(input, 'abc');
            expect(status()).toBe('valid');

            await user.clear(input);
            expect(status()).toBe('invalid');
        });

        it('starts valid when the initial value passes', () => {
            const probe = {};
            setup(<Field initial="abc" probe={probe} />);

            expect(status()).toBe('valid');
            expect(probe.ctr.err()).toBe(false);
        });

        it('accepts a function as the initial value', () => {
            const probe = {};
            setup(<Field initial={() => 'lazy'} probe={probe} />);

            expect(probe.value).toBe('lazy');
            expect(screen.getByRole('textbox').value).toBe('lazy');
        });

        it('reports which rule failed and its message', async () => {
            const probe = {};
            const { user } = setup(<Field probe={probe} rules={['required', { name: 'minLength', value: 3, message: 'Too short' }]} />);

            await user.type(screen.getByRole('textbox'), 'ab');

            expect(probe.ctr.err('required')).toBe(false);
            expect(probe.ctr.err('minLength')).toEqual({ message: 'Too short' });
            expect(probe.ctr.err('minLength').message).toBe('Too short');
            expect(probe.ctr.message()).toBe('Too short');
            expect(probe.ctr.message('minLength')).toBe('Too short');
        });

        it('supports functional updates', () => {
            const probe = {};
            setup(<Field probe={probe} />);

            act(() => probe.setValue(previous => `${previous}x`));
            act(() => probe.setValue(previous => `${previous}y`));

            expect(screen.getByRole('textbox').value).toBe('xy');
            expect(status()).toBe('valid');
        });

        it('exposes the value, rules and a unique string key on the control', () => {
            const first = {};
            const second = {};
            setup(
                <>
                    <Field probe={first} initial="a" rules={['required']} />
                    <Field probe={second} />
                </>,
            );

            expect(first.ctr.value).toBe('a');
            expect(first.ctr.rules).toEqual(['required']);
            expect(first.ctr.key).toBeTypeOf('string');
            expect(first.ctr.key).not.toBe(second.ctr.key);
        });
    });

    describe('dirty state and derr', () => {
        it('hides errors until the form is marked dirty', () => {
            const probe = {};
            setup(<Field probe={probe} />);

            expect(probe.ctr.derr()).toBe(false);
            expect(shownError()).toBe('');

            act(() => probe.ctx.setDirty());

            expect(probe.ctr.derr()).toBe(true);
            expect(shownError()).toBe('required');
        });

        it('onBlur marks the control dirty', async () => {
            const probe = {};
            const { user } = setup(<Field probe={probe} />);

            expect(probe.ctr.dirty).toBe(false);
            await user.click(screen.getByRole('textbox'));
            await user.tab();

            expect(probe.ctr.dirty).toBe(true);
        });

        it('derr(false) needs a dirty control, derr(true) a dirty control or form', async () => {
            const probe = {};
            const { user } = setup(<Field probe={probe} />);

            expect(probe.ctr.derr(false)).toBe(false);
            expect(probe.ctr.derr(true)).toBe(false);

            await user.click(screen.getByRole('textbox'));
            await user.tab();

            expect(probe.ctr.derr()).toBe(false);
            expect(probe.ctr.derr(false)).toBe(true);
            expect(probe.ctr.derr(true)).toBe(true);
            expect(probe.ctr.derr('required', false)).toEqual({ message: 'required' });
        });

        it('derr(true) is satisfied by a dirty form even for an untouched control', () => {
            const probe = {};
            setup(<Field probe={probe} />);

            act(() => probe.ctx.setDirty());

            expect(probe.ctr.dirty).toBe(false);
            expect(probe.ctr.derr(true)).toBe(true);
            expect(probe.ctr.derr(false)).toBe(false);
        });

        it('derr(rule) only reports that rule', () => {
            const probe = {};
            setup(<Field probe={probe} rules={['required', 'email']} />);

            act(() => probe.ctx.setDirty());

            expect(probe.ctr.derr('required')).toEqual({ message: 'required' });
            expect(probe.ctr.derr('email')).toBe(false);
        });

        it('setDirty and setPristine on the control', () => {
            const probe = {};
            setup(<Field probe={probe} />);

            act(() => probe.ctr.setDirty());
            expect(probe.ctr.dirty).toBe(true);

            act(() => probe.ctr.setPristine());
            expect(probe.ctr.dirty).toBe(false);
        });

        it('setting the form pristine also resets dirty controls', async () => {
            const probe = {};
            const { user } = setup(<Field probe={probe} />);

            await user.click(screen.getByRole('textbox'));
            await user.tab();
            act(() => probe.ctx.setDirty());
            expect(probe.ctr.dirty).toBe(true);

            act(() => probe.ctx.setPristine());

            expect(probe.ctr.dirty).toBe(false);
            expect(probe.ctr.derr(false)).toBe(false);
            expect(probe.ctr.derr(true)).toBe(false);
        });

        it('controls can be made dirty again after the form was reset', async () => {
            const probe = {};
            const { user } = setup(<Field probe={probe} />);

            act(() => probe.ctx.setDirty());
            act(() => probe.ctx.setPristine());
            await user.click(screen.getByRole('textbox'));
            await user.tab();

            expect(probe.ctr.dirty).toBe(true);
        });
    });

    describe('forms with several fields', () => {
        it('shows the parent form as invalid on the first render', () => {
            setup(<ParentForm />);

            expect(status()).toBe('invalid');
        });

        it('is valid only when every field is valid', async () => {
            const { user } = setup(<ParentForm />);

            await user.type(screen.getByLabelText('name'), 'Ann');
            expect(status()).toBe('invalid');

            await user.type(screen.getByLabelText('email'), 'not-an-email');
            expect(status()).toBe('invalid');

            await user.clear(screen.getByLabelText('email'));
            await user.type(screen.getByLabelText('email'), 'ann@example.com');
            expect(status()).toBe('valid');
        });

        it('removes the result of a field when it unmounts', async () => {
            const probe = {};
            const { user, rerender } = setup(<ParentForm probe={probe} />);

            await user.type(screen.getByLabelText('email'), 'ann@example.com');
            expect(status()).toBe('invalid');

            rerender(<ParentForm probe={probe} showChild={false} />);

            expect(status()).toBe('valid');
            expect(probe.ctx.isValid()).toBe(true);
        });

        it('moves the result of a field to its new context when the context changes', () => {
            const first = createValidationContext();
            const second = createValidationContext();
            const { rerender } = setup(<ChildField ctx={first} label="field" />);

            expect(first.isValid()).toBe(false);
            expect(second.isValid()).toBe(true);

            rerender(<ChildField ctx={second} label="field" />);

            expect(first.isValid()).toBe(true);
            expect(second.isValid()).toBe(false);
        });
    });

    describe('useValidationValue', () => {
        function Shared({ probe }) {
            const ctx = useValidationContext();
            const shared = useValidationValue('');
            const [a, setA, required] = useValidation(shared, ['required'], ctx);
            const [b, setB, short] = useValidation(shared, [{ name: 'maxLength', value: 2 }], ctx);
            Object.assign(probe, { ctx, a, b, setA, setB, required, short });
            return null;
        }

        it('shares one value between several validations', () => {
            const probe = {};
            setup(<Shared probe={probe} />);

            expect([probe.a, probe.b]).toEqual(['', '']);
            expect(probe.required.err()).toBe(true);
            expect(probe.short.err()).toBe(false);

            act(() => probe.setA('abc'));
            expect([probe.a, probe.b]).toEqual(['abc', 'abc']);
            expect(probe.required.err()).toBe(false);
            expect(probe.short.err()).toBe(true);

            act(() => probe.setB(previous => previous.slice(0, 2)));
            expect([probe.a, probe.b]).toEqual(['ab', 'ab']);
            expect(probe.ctx.isValid()).toBe(true);
        });

        it('accepts a function as the initial value', () => {
            const probe = {};

            function Lazy() {
                const ctx = useValidationContext();
                const shared = useValidationValue(() => 'lazy');
                const [value] = useValidation(shared, ['required'], ctx);
                probe.value = value;
                return null;
            }

            setup(<Lazy />);
            expect(probe.value).toBe('lazy');
        });
    });
});
