import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createValidationContext } from '../../src/index.js';

const errors = (...names) => names.map(name => ({ name, message: `${name}!` }));

let ctx;

beforeEach(() => {
    ctx = createValidationContext();
});

describe('createValidationContext', () => {
    it('starts valid, pristine and with key 0', () => {
        expect(ctx.key).toBe(0);
        expect(ctx.dirty).toBe(false);
        expect(ctx.isValid()).toBe(true);
    });

    it('creates independent contexts', () => {
        const other = createValidationContext();
        ctx.addResult('a', errors('required'));

        expect(ctx.isValid()).toBe(false);
        expect(other.isValid()).toBe(true);
    });
});

describe('results', () => {
    it('getState returns valid with no errors for an unknown key', () => {
        expect(ctx.getState('unknown')).toEqual({ valid: true, errors: {} });
    });

    it('getState lists the errors of a key by rule name', () => {
        ctx.addResult('a', errors('required', 'minLength'));

        expect(ctx.getState('a')).toEqual({
            valid: false,
            errors: { required: { message: 'required!' }, minLength: { message: 'minLength!' } },
        });
    });

    it('treats an empty result list as valid', () => {
        ctx.addResult('a', []);

        expect(ctx.getState('a')).toEqual({ valid: true, errors: {} });
        expect(ctx.isValid()).toBe(true);
        expect(ctx.hasError('a')).toBe(false);
    });

    it('treats null or undefined results as no errors', () => {
        ctx.addResult('a', null);
        ctx.addResult('b', undefined);
        ctx.addResult('c', errors('required'));
        ctx.addResult('c', null);

        expect(ctx.isValid()).toBe(true);
        expect(ctx.getState('a')).toEqual({ valid: true, errors: {} });
        expect(ctx.hasError('b')).toBe(false);
        expect(ctx.getMessage('c')).toBe('');
    });

    it('treats false, 0 or an empty string as no errors', () => {
        ctx.addResult('a', false);
        ctx.addResult('b', 0);
        ctx.addResult('c', errors('required'));
        ctx.addResult('c', '');

        expect(ctx.isValid()).toBe(true);
        expect(ctx.getState('a')).toEqual({ valid: true, errors: {} });
        expect(ctx.hasError('b')).toBe(false);
        expect(ctx.getMessage('c')).toBe('');
    });

    it('is invalid while any key has errors', () => {
        ctx.addResult('a', errors('required'));
        ctx.addResult('b', errors('email'));
        ctx.removeResult('a');
        expect(ctx.isValid()).toBe(false);

        ctx.removeResult('b');
        expect(ctx.isValid()).toBe(true);
    });

    it('reads name and message of Error objects', () => {
        const error = new Error('Email taken');
        ctx.addResult('server', [error]);

        expect(ctx.getMessage('server')).toBe('Email taken');
        expect(ctx.getState('server').errors).toEqual({ Error: { message: 'Email taken' } });
    });

    it('replaces the previous result of a key', () => {
        ctx.addResult('a', errors('required'));
        ctx.addResult('a', errors('email'));

        expect(ctx.getState('a').errors).toEqual({ email: { message: 'email!' } });
    });
});

describe('hasError', () => {
    it('without a rule reports whether the key has any error', () => {
        ctx.addResult('a', errors('required'));
        ctx.addResult('b', []);

        expect(ctx.hasError('a')).toBe(true);
        expect(ctx.hasError('b')).toBe(false);
        expect(ctx.hasError('unknown')).toBe(false);
    });

    it('with a rule returns the error object, so its message can be read', () => {
        ctx.addResult('a', errors('required'));

        expect(ctx.hasError('a', 'required')).toEqual({ message: 'required!' });
        expect(ctx.hasError('a', 'required').message).toBe('required!');
    });

    it('with a rule returns false when that rule passed or the key is unknown', () => {
        ctx.addResult('a', errors('required'));

        expect(ctx.hasError('a', 'email')).toBe(false);
        expect(ctx.hasError('unknown', 'required')).toBe(false);
    });
});

describe('getMessage', () => {
    beforeEach(() => {
        ctx.addResult('a', errors('required', 'minLength'));
    });

    it('returns the message of the given rule', () => {
        expect(ctx.getMessage('a', 'minLength')).toBe('minLength!');
    });

    it('returns the first error message without a rule', () => {
        expect(ctx.getMessage('a')).toBe('required!');
    });

    it('falls back to the first error message when the given rule passed', () => {
        expect(ctx.getMessage('a', 'email')).toBe('required!');
    });

    it('returns an empty string for valid and unknown keys', () => {
        ctx.addResult('b', []);

        expect(ctx.getMessage('b')).toBe('');
        expect(ctx.getMessage('unknown')).toBe('');
        expect(ctx.getMessage('unknown', 'required')).toBe('');
    });
});

describe('dirty state', () => {
    it('setDirty and setPristine toggle dirty and return the context', () => {
        expect(ctx.setDirty()).toBe(ctx);
        expect(ctx.dirty).toBe(true);

        expect(ctx.setPristine()).toBe(ctx);
        expect(ctx.dirty).toBe(false);
    });
});

describe('notifications', () => {
    it('notifies subscribers and bumps the key on every change', () => {
        const listener = vi.fn();
        ctx.on().subscribe(listener);

        ctx.addResult('a', errors('required'));
        ctx.setDirty();
        ctx.removeResult('a');
        ctx.setPristine();

        expect(listener.mock.calls).toEqual([['a'], [''], ['a'], ['']]);
        expect(ctx.key).toBe(4);
    });

    it('does not notify when nothing changed', () => {
        const listener = vi.fn();
        ctx.on().subscribe(listener);

        ctx.setPristine();
        ctx.removeResult('missing');
        ctx.setDirty();
        ctx.setDirty();
        ctx.addResult('a', errors('required'));
        ctx.addResult('a', errors('required'));
        ctx.addResult('b', []);
        ctx.addResult('b', []);

        expect(listener).toHaveBeenCalledTimes(3);
        expect(ctx.key).toBe(3);
    });

    it('notifies when a result changes its message or rules', () => {
        const listener = vi.fn();
        ctx.addResult('a', [{ name: 'required', message: 'one' }]);
        ctx.on().subscribe(listener);

        ctx.addResult('a', [{ name: 'required', message: 'two' }]);
        ctx.addResult('a', [{ name: 'email', message: 'two' }]);
        ctx.addResult('a', [{ name: 'email', message: 'two' }, { name: 'min', message: 'x' }]);

        expect(listener).toHaveBeenCalledTimes(3);
    });

    it('does not notify when the same array is added again', () => {
        const listener = vi.fn();
        const serverErrors = errors('taken');
        ctx.addResult('a', serverErrors);
        ctx.on().subscribe(listener);

        ctx.addResult('a', serverErrors);

        expect(listener).not.toHaveBeenCalled();
    });

    it('notifies when the same array is added again after changing it in place', () => {
        const listener = vi.fn();
        const serverErrors = errors('taken');
        ctx.addResult('a', serverErrors);
        ctx.on().subscribe(listener);

        serverErrors.push({ name: 'banned', message: 'banned!' });
        ctx.addResult('a', serverErrors);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(ctx.getMessage('a', 'banned')).toBe('banned!');
    });

    it('notifies when the same array is cleared in place and added again', () => {
        const listener = vi.fn();
        const serverErrors = errors('taken');
        ctx.addResult('a', serverErrors);
        ctx.on().subscribe(listener);

        serverErrors.length = 0;
        ctx.addResult('a', serverErrors);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(ctx.hasError('a')).toBe(false);
    });

    it('notifies when an item of the same array is edited in place and added again', () => {
        const listener = vi.fn();
        const serverErrors = errors('taken');
        ctx.addResult('a', serverErrors);
        ctx.on().subscribe(listener);

        serverErrors[0].message = 'changed';
        ctx.addResult('a', serverErrors);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(ctx.getMessage('a', 'taken')).toBe('changed');
    });

    it('a listener that re-adds the stored results does not loop', () => {
        const serverErrors = errors('taken');
        ctx.addResult('a', serverErrors);
        const listener = vi.fn(() => ctx.addResult('a', serverErrors));
        ctx.on().subscribe(listener);

        ctx.notify();

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not notify when the same array of Error objects is added again', () => {
        const listener = vi.fn();
        const serverErrors = [new Error('Email taken')];
        ctx.addResult('a', serverErrors);
        ctx.on().subscribe(listener);

        ctx.addResult('a', serverErrors);

        expect(listener).not.toHaveBeenCalled();
    });

    it('a listener that re-adds null results does not loop', () => {
        ctx.addResult('a', null);
        const listener = vi.fn(() => ctx.addResult('a', null));
        ctx.on().subscribe(listener);

        ctx.notify();

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('an explicit notify always notifies and bumps the key', () => {
        const listener = vi.fn();
        ctx.on().subscribe(listener);

        ctx.notify();
        ctx.notify();

        expect(listener).toHaveBeenCalledTimes(2);
        expect(ctx.key).toBe(2);
    });

    it('keyed subscribers only hear their own key and global notifications', () => {
        const a = vi.fn();
        const b = vi.fn();
        const all = vi.fn();
        ctx.on('a').subscribe(a);
        ctx.on('b').subscribe(b);
        ctx.on().subscribe(all);

        ctx.notify('a');
        expect([a.mock.calls.length, b.mock.calls.length, all.mock.calls.length]).toEqual([1, 0, 1]);

        ctx.notify();
        expect([a.mock.calls.length, b.mock.calls.length, all.mock.calls.length]).toEqual([2, 1, 2]);
    });

    it('stops notifying after unsubscribe, which is safe to call twice', () => {
        const listener = vi.fn();
        const subscription = ctx.on().subscribe(listener);

        subscription.unsubscribe();
        subscription.unsubscribe();
        ctx.notify();

        expect(listener).not.toHaveBeenCalled();
    });

    it('still calls the next listener when one unsubscribes itself during notify', () => {
        const once = vi.fn(() => subscription.unsubscribe());
        const next = vi.fn();
        const subscription = ctx.on().subscribe(once);
        ctx.on().subscribe(next);

        ctx.notify();
        ctx.notify();

        expect(once).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(2);
    });

    it('does not call a listener that an earlier listener removed during the same notify', () => {
        const removed = vi.fn();
        let subscription;
        ctx.on().subscribe(() => subscription.unsubscribe());
        subscription = ctx.on().subscribe(removed);

        ctx.notify();

        expect(removed).not.toHaveBeenCalled();
    });

    it('calls a listener added during notify from the next notify on', () => {
        const added = vi.fn();
        let subscribed = false;
        ctx.on().subscribe(() => {
            if (subscribed) return;
            subscribed = true;
            ctx.on().subscribe(added);
        });

        ctx.notify();
        expect(added).not.toHaveBeenCalled();

        ctx.notify();
        expect(added).toHaveBeenCalledTimes(1);
    });

    it('wraps the key around after 10,000,000', () => {
        ctx.key = 10000000;
        ctx.notify();

        expect(ctx.key).toBe(0);
    });
});
