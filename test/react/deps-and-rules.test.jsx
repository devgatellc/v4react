import { describe, expect, it, vi } from 'vitest';
import { useEffect, useLayoutEffect } from 'react';
import { act, render } from '@testing-library/react';
import { createValidationContext, useValidation, useValidationContext } from '../../src/index.js';
import { modes } from './helpers.jsx';

const matchesFirstDep = { name: 'equals', value: deps => deps[0], message: 'Does not match' };

function Confirm({ deps, probe = {}, initial = 'secret', rules = [matchesFirstDep] }) {
    const ctx = useValidationContext();
    const [value, setValue, ctr] = useValidation(initial, rules, ctx, deps);
    Object.assign(probe, { ctx, ctr, setValue, value });
    return null;
}

function MinLength({ min, initial = 'abcd', probe = {} }) {
    const ctx = useValidationContext();
    const [value, setValue, ctr] = useValidation(initial, [{ name: 'minLength', value: min }], ctx);
    Object.assign(probe, { ctx, ctr, setValue, value });
    return null;
}

const recordDeps = calls => ({ name: 'record', validator: (value, ruleValue, deps) => { calls.push(deps); return true; } });

describe.each(modes)('deps in $mode', ({ wrapper }) => {
    const setup = ui => render(ui, { wrapper });

    it('passes deps to rule value functions', () => {
        const probe = {};
        setup(<Confirm deps={['secret']} probe={probe} />);

        expect(probe.ctx.isValid()).toBe(true);
    });

    it('re-validates when deps change even if the value does not', () => {
        const probe = {};
        const { rerender } = setup(<Confirm deps={['secret']} probe={probe} />);

        rerender(<Confirm deps={['other']} probe={probe} />);
        expect(probe.ctx.isValid()).toBe(false);
        expect(probe.ctr.message()).toBe('Does not match');

        rerender(<Confirm deps={['secret']} probe={probe} />);
        expect(probe.ctx.isValid()).toBe(true);
    });

    it('keeps the same control while deps keep the same values', () => {
        const probe = {};
        const { rerender } = setup(<Confirm deps={['secret', 1]} probe={probe} />);
        const control = probe.ctr;

        rerender(<Confirm deps={['secret', 1]} probe={probe} />);

        expect(probe.ctr).toBe(control);
    });

    it('re-validates when the number of deps changes, without React warnings', () => {
        const probe = {};
        const { rerender } = setup(<Confirm deps={['secret']} probe={probe} />);

        rerender(<Confirm deps={['other', 'extra']} probe={probe} />);
        expect(probe.ctx.isValid()).toBe(false);

        rerender(<Confirm deps={['secret']} probe={probe} />);
        expect(probe.ctx.isValid()).toBe(true);
    });

    it('accepts objects created inline in deps without crashing', () => {
        const calls = [];
        const probe = {};
        const Inline = ({ filter }) => <Confirm deps={[{ filter }]} rules={[recordDeps(calls)]} probe={probe} />;
        const { rerender } = setup(<Inline filter="a" />);

        rerender(<Inline filter="a" />);
        act(() => probe.setValue('changed'));
        rerender(<Inline filter="b" />);

        expect(calls.at(-1)).toEqual([{ filter: 'b' }]);
        expect(probe.ctx.isValid()).toBe(true);
    });

    it('accepts strings and Sets as deps', () => {
        const calls = [];
        const { rerender } = setup(<Confirm deps="ab" rules={[recordDeps(calls)]} />);
        expect(calls.at(-1)).toBe('ab');

        const set = new Set([1, 2]);
        rerender(<Confirm deps={set} rules={[recordDeps(calls)]} />);
        expect(calls.at(-1)).toBe(set);
    });

    it('notices when the same deps array is changed in place', () => {
        const probe = {};
        const deps = ['secret'];
        const { rerender } = setup(<Confirm deps={deps} probe={probe} />);
        expect(probe.ctx.isValid()).toBe(true);

        deps[0] = 'other';
        rerender(<Confirm deps={deps} probe={probe} />);

        expect(probe.ctx.isValid()).toBe(false);
    });

    it('passes the deps of the current render to rule functions', () => {
        const calls = [];
        const probe = {};
        const { rerender } = setup(<Confirm rules={[recordDeps(calls)]} probe={probe} />);
        expect(calls.at(-1)).toBeUndefined();

        rerender(<Confirm deps={[]} rules={[recordDeps(calls)]} probe={probe} />);
        act(() => probe.setValue('changed'));

        expect(calls.at(-1)).toEqual([]);
    });
});

describe.each(modes)('rules in $mode', ({ wrapper }) => {
    const setup = ui => render(ui, { wrapper });

    it('does not re-validate when only the rules change', () => {
        const probe = {};
        const { rerender } = setup(<MinLength min={3} probe={probe} />);

        rerender(<MinLength min={10} probe={probe} />);

        expect(probe.ctx.isValid()).toBe(true);
    });

    it('uses the new rules once the value changes', () => {
        const probe = {};
        const { rerender } = setup(<MinLength min={3} probe={probe} />);

        rerender(<MinLength min={10} probe={probe} />);
        act(() => probe.setValue('abcde'));

        expect(probe.ctx.isValid()).toBe(false);
    });

    it('validate() uses the latest rules', () => {
        const probe = {};
        const { rerender } = setup(<MinLength min={3} probe={probe} />);

        rerender(<MinLength min={10} probe={probe} />);
        act(() => probe.ctr.validate());

        expect(probe.ctx.isValid()).toBe(false);
    });

    it('control.rules returns the latest rules', () => {
        const probe = {};
        const { rerender } = setup(<MinLength min={3} probe={probe} />);

        rerender(<MinLength min={10} probe={probe} />);

        expect(probe.ctr.rules).toEqual([{ name: 'minLength', value: 10 }]);
    });

    it('validate() from a layout effect sees the rules of the same render', () => {
        const ctx = createValidationContext();
        const seen = [];

        function LayoutCheck({ value, min }) {
            const [, , ctr] = useValidation(value, [{ name: 'minLength', value: min }], ctx);
            useLayoutEffect(() => {
                ctr.validate();
                seen.push(ctr.err());
            });
            return null;
        }

        const { rerender } = setup(<LayoutCheck value="abcd" min={3} />);
        expect(seen.at(-1)).toBe(false);

        rerender(<LayoutCheck value="abcde" min={10} />);
        expect(seen.at(-1)).toBe(true);

        rerender(<LayoutCheck value="abcde" min={3} />);
        expect(seen.at(-1)).toBe(false);
    });

    it('validate() from a child effect sees the latest rules', () => {
        const ctx = createValidationContext();
        const seen = [];

        function Child({ ctr }) {
            useEffect(() => {
                ctr.validate();
                seen.push(ctr.err());
            });
            return null;
        }

        function Parent({ value, min }) {
            const [, , ctr] = useValidation(value, [{ name: 'minLength', value: min }], ctx);
            return <Child ctr={ctr} />;
        }

        const { rerender } = setup(<Parent value="abcd" min={3} />);
        expect(seen.at(-1)).toBe(false);

        rerender(<Parent value="abcde" min={10} />);
        expect(seen.at(-1)).toBe(true);

        rerender(<Parent value="abcde" min={3} />);
        expect(seen.at(-1)).toBe(false);
    });

    it('validates with a custom validator from the rules', () => {
        const validator = vi.fn(value => value.startsWith('A'));
        const probe = {};

        function Custom() {
            const ctx = useValidationContext();
            const [, setValue, ctr] = useValidation('abc', [{ name: 'startsWithA', validator }], ctx);
            Object.assign(probe, { ctx, ctr, setValue });
            return null;
        }

        setup(<Custom />);
        expect(probe.ctr.err('startsWithA')).toEqual({ message: 'startsWithA' });

        act(() => probe.setValue('Abc'));
        expect(probe.ctx.isValid()).toBe(true);
        expect(validator).toHaveBeenCalledWith('Abc', undefined, undefined);
    });
});
