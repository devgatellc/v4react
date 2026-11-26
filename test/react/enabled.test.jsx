import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useValidation, useValidationContext } from '../../src/index.js';
import { modes } from './helpers.jsx';

function Field({ deps, enabled, rules = ['required'], initial = '', probe = {} }) {
    const ctx = useValidationContext();
    const [value, setValue, ctr, onBlur] = useValidation(initial, rules, ctx, deps, enabled);
    Object.assign(probe, { ctx, ctr });

    return (
        <>
            <input aria-label="field" value={value} onChange={event => setValue(event.target.value)} onBlur={onBlur} />
            <output data-testid="status">{ctx.isValid() ? 'valid' : 'invalid'}</output>
        </>
    );
}

const status = () => screen.getByTestId('status').textContent;

describe.each(modes)('enabled in $mode', ({ wrapper }) => {
    const setup = ui => ({ user: userEvent.setup(), ...render(ui, { wrapper }) });

    it('does not validate a disabled control', () => {
        const probe = {};
        setup(<Field enabled={false} probe={probe} />);

        expect(status()).toBe('valid');
        expect(probe.ctr.err()).toBe(false);
    });

    it('adds and removes the result when the control is enabled and disabled', () => {
        const probe = {};
        const { rerender } = setup(<Field enabled={false} probe={probe} />);

        rerender(<Field enabled={true} probe={probe} />);
        expect(status()).toBe('invalid');

        rerender(<Field enabled={false} probe={probe} />);
        expect(status()).toBe('valid');
    });

    it('accepts a function of the current value', async () => {
        const rules = [{ name: 'minLength', value: 5 }];
        const { user } = setup(<Field rules={rules} enabled={value => value !== 'skip'} initial="abcdef" />);
        const input = screen.getByRole('textbox');

        await user.clear(input);
        await user.type(input, 'abc');
        expect(status()).toBe('invalid');

        await user.clear(input);
        await user.type(input, 'skip');
        expect(status()).toBe('valid');
    });

    it('accepts a boolean in place of deps', () => {
        const { rerender } = setup(<Field deps={false} />);
        expect(status()).toBe('valid');

        rerender(<Field deps={true} />);
        expect(status()).toBe('invalid');
    });

    it('accepts a function in place of deps', () => {
        setup(<Field deps={value => value === ''} />);
        expect(status()).toBe('invalid');
    });

    it('accepts deps and enabled together', () => {
        const { rerender } = setup(<Field deps={[1]} enabled={false} />);
        expect(status()).toBe('valid');

        rerender(<Field deps={[1]} enabled={true} />);
        expect(status()).toBe('invalid');
    });

    it('resets the control dirty flag when it is disabled', async () => {
        const probe = {};
        const { user, rerender } = setup(<Field enabled={true} probe={probe} />);

        await user.click(screen.getByRole('textbox'));
        await user.tab();
        expect(probe.ctr.dirty).toBe(true);

        rerender(<Field enabled={false} probe={probe} />);

        expect(probe.ctr.dirty).toBe(false);
    });
});
