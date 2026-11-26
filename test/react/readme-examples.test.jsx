import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memo, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    usePValidation,
    usePValidationContext,
    useValidation,
    useValidationContext,
    useValidationValue,
    validateValue,
    validationConfig,
    ValidationProvider,
} from '../../src/index.js';
import { modes } from './helpers.jsx';

const errors = () => screen.queryAllByRole('alert').map(element => element.textContent);

function TextInput({ onChangeText, label, ...props }) {
    return <input aria-label={label} {...props} onChange={event => onChangeText(event.target.value)} />;
}

let savedValidators;
let savedConverts;

beforeEach(() => {
    savedValidators = { ...validationConfig.validators };
    savedConverts = { ...validationConfig.converts };
});

afterEach(() => {
    for (const name of Object.keys(validationConfig.validators)) {
        if (!(name in savedValidators)) delete validationConfig.validators[name];
    }
    for (const name of Object.keys(validationConfig.converts)) {
        if (!(name in savedConverts)) delete validationConfig.converts[name];
    }
    validationConfig.validators = savedValidators;
    validationConfig.converts = savedConverts;
});

describe.each(modes)('README examples in $mode', ({ wrapper }) => {
    const setup = ui => ({ user: userEvent.setup(), ...render(ui, { wrapper }) });

    it('quick start (web): shows errors after blur or submit and submits valid data', async () => {
        const createAccount = vi.fn();

        function SignUpForm() {
            const form = useValidationContext();

            const [email, setEmail, emailControl, onEmailBlur] = useValidation('', ['required', 'email'], form);
            const [password, setPassword, passwordControl, onPasswordBlur] = useValidation('', [
                'required',
                { name: 'minLength', value: 8, message: 'Use at least 8 characters' },
            ], form);

            const submit = event => {
                event.preventDefault();
                form.setDirty();

                if (form.isValid()) {
                    createAccount(email, password);
                }
            };

            return (
                <form onSubmit={submit} noValidate>
                    <input aria-label="email" type="email" value={email} onChange={event => setEmail(event.target.value)} onBlur={onEmailBlur} />
                    {emailControl.derr(true) && <p role="alert">{emailControl.message()}</p>}

                    <input aria-label="password" type="password" value={password} onChange={event => setPassword(event.target.value)} onBlur={onPasswordBlur} />
                    {passwordControl.derr(true) && <p role="alert">{passwordControl.message()}</p>}

                    <button type="submit">Sign up</button>
                </form>
            );
        }

        const { user } = setup(<SignUpForm />);
        expect(errors()).toEqual([]);

        await user.click(screen.getByLabelText('email'));
        await user.tab();
        expect(errors()).toEqual(['required']);

        await user.click(screen.getByRole('button', { name: 'Sign up' }));
        expect(errors()).toEqual(['required', 'required']);
        expect(createAccount).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText('email'), 'ann@example.com');
        await user.type(screen.getByLabelText('password'), 'short');
        expect(errors()).toEqual(['Use at least 8 characters']);

        await user.type(screen.getByLabelText('password'), 'enough');
        await user.click(screen.getByRole('button', { name: 'Sign up' }));
        expect(createAccount).toHaveBeenCalledWith('ann@example.com', 'shortenough');
    });

    it('quick start (React Native): setters work as onChangeText and onBlur ignores the event', async () => {
        const signIn = vi.fn();

        function SignInScreen() {
            const form = useValidationContext();

            const [email, setEmail, emailControl, onEmailBlur] = useValidation('', ['required', 'email'], form);
            const [password, setPassword, passwordControl, onPasswordBlur] = useValidation('', ['required'], form);

            const submit = () => {
                form.setDirty();

                if (form.isValid()) {
                    signIn(email, password);
                }
            };

            return (
                <div>
                    <TextInput label="email" value={email} onChangeText={setEmail} onBlur={onEmailBlur} />
                    {emailControl.derr(true) && <p role="alert">{emailControl.message()}</p>}
                    <TextInput label="password" value={password} onChangeText={setPassword} onBlur={onPasswordBlur} />
                    {passwordControl.derr(true) && <p role="alert">{passwordControl.message()}</p>}
                    <button type="button" onClick={submit}>Sign in</button>
                </div>
            );
        }

        const { user } = setup(<SignInScreen />);

        await user.type(screen.getByLabelText('email'), 'not-an-email');
        await user.tab();
        expect(errors()).toEqual(['email']);

        await user.clear(screen.getByLabelText('email'));
        await user.type(screen.getByLabelText('email'), 'ann@example.com');
        await user.type(screen.getByLabelText('password'), 'secret');
        await user.click(screen.getByRole('button', { name: 'Sign in' }));
        expect(signIn).toHaveBeenCalledWith('ann@example.com', 'secret');
    });

    it('custom validators: strongPassword', () => {
        const strongPassword = {
            name: 'strongPassword',
            validator: value => !value || (/[A-Z]/.test(value) && /\d/.test(value)),
            message: 'Use an uppercase letter and a number',
        };

        expect(validateValue('', ['required', strongPassword])).toEqual([{ name: 'required', message: 'required' }]);
        expect(validateValue('password', ['required', strongPassword])).toEqual([{ name: 'strongPassword', message: 'Use an uppercase letter and a number' }]);
        expect(validateValue('Passw0rd', ['required', strongPassword])).toBeNull();
    });

    it('registered validators: phone and notIn', () => {
        validationConfig.validators = {
            phone: value => !value || /^\+?\d{7,15}$/.test(value),
            notIn: (value, list) => !list.includes(value),
        };

        expect(validateValue('+995555123456', ['required', 'phone'])).toBeNull();
        expect(validateValue('12', ['required', 'phone'])).toEqual([{ name: 'phone', message: 'phone' }]);
        expect(validateValue('admin', [{ name: 'notIn', value: ['admin', 'root'], message: 'This name is reserved' }])).toEqual([{ name: 'notIn', message: 'This name is reserved' }]);
        expect(validationConfig.validators.required).toBeTypeOf('function');
    });

    it('built-in validator examples', () => {
        expect(validateValue('', [{ name: 'requiredIf', value: true }])).not.toBeNull();
        expect(validateValue('', [{ name: 'requiredIf', value: false }])).toBeNull();
        expect(validateValue(17, [{ name: 'min', value: 18, message: 'You must be at least 18' }])).toEqual([{ name: 'min', message: 'You must be at least 18' }]);
        expect(validateValue('AB123456', [{ name: 'pattern', value: '^[A-Z]{2}\\d{6}$', message: 'Use the format AB123456' }])).toBeNull();
        expect(validateValue('AB12', [{ name: 'pattern', value: '^[A-Z]{2}\\d{6}$', message: 'Use the format AB123456' }])).not.toBeNull();
        expect(validateValue('ABC', [{ name: 'pattern', value: { pattern: '^[a-z]+$', flags: 'i' } }])).toBeNull();
        expect(validateValue(0, ['required'])).toBeNull();
        expect(validateValue(false, ['required'])).toBeNull();
    });

    it('converts examples', () => {
        expect(validateValue('   ', [{ name: 'required', convert: 'trim' }])).not.toBeNull();
        expect(validateValue('yes', [{ name: 'equals', value: 'YES', convert: 'upper' }])).toBeNull();
        expect(validateValue('(555) 12-3', [{ name: 'minLength', value: 7, convert: value => String(value).replace(/\D/g, '') }])).not.toBeNull();
        expect(validateValue('(555) 12-34', [{ name: 'minLength', value: 7, convert: value => String(value).replace(/\D/g, '') }])).toBeNull();
        expect(validateValue('  ABC ', [{ name: 'equals', value: 'abc', convert: { trim: true, lower: true } }])).toBeNull();

        validationConfig.converts = { digits: value => String(value ?? '').replace(/\D/g, '') };
        expect(validateValue('a1b2', [{ name: 'equals', value: '12', convert: 'digits' }])).toBeNull();
    });

    it('validateValue example output', () => {
        expect(validateValue('ab', ['required', { name: 'minLength', value: 3 }])).toEqual([{ name: 'minLength', message: 'minLength' }]);
    });

    it('rule values that depend on other values: confirm password', async () => {
        function Passwords() {
            const form = useValidationContext();
            const [password, setPassword] = useValidation('', ['required'], form);
            const [confirm, setConfirm, confirmControl] = useValidation('', [
                'required',
                { name: 'equals', value: deps => deps[0], message: 'Passwords do not match' },
            ], form, [password]);

            return (
                <>
                    <input aria-label="password" value={password} onChange={event => setPassword(event.target.value)} />
                    <input aria-label="confirm" value={confirm} onChange={event => setConfirm(event.target.value)} />
                    {confirmControl.err('equals') && <p role="alert">{confirmControl.message('equals')}</p>}
                </>
            );
        }

        const { user } = setup(<Passwords />);

        await user.type(screen.getByLabelText('password'), 'secret');
        await user.type(screen.getByLabelText('confirm'), 'secret');
        expect(errors()).toEqual([]);

        await user.type(screen.getByLabelText('password'), '2');
        expect(errors()).toEqual(['Passwords do not match']);
    });

    it('cross-field rules: end date after start date', async () => {
        function Dates() {
            const form = useValidationContext();
            const [startDate, setStartDate] = useValidation('', ['required'], form);
            const [endDate, setEndDate, endControl] = useValidation('', [
                'required',
                {
                    name: 'afterStart',
                    validator: (end, ruleValue, [start]) => !end || !start || end >= start,
                    message: 'The end date must be after the start date',
                },
            ], form, [startDate]);

            return (
                <>
                    <input aria-label="start" value={startDate} onChange={event => setStartDate(event.target.value)} />
                    <input aria-label="end" value={endDate} onChange={event => setEndDate(event.target.value)} />
                    {endControl.err('afterStart') && <p role="alert">{endControl.message('afterStart')}</p>}
                </>
            );
        }

        const { user } = setup(<Dates />);

        await user.type(screen.getByLabelText('start'), '2026-05-01');
        await user.type(screen.getByLabelText('end'), '2026-05-10');
        expect(errors()).toEqual([]);

        await user.clear(screen.getByLabelText('start'));
        await user.type(screen.getByLabelText('start'), '2026-06-01');
        expect(errors()).toEqual(['The end date must be after the start date']);
    });

    it('fields that depend on each other: min and max with useValidationValue', () => {
        const probe = {};

        function Range() {
            const form = useValidationContext();
            const min = useValidationValue('');
            const max = useValidationValue('');

            const [minValue, setMin, minControl] = useValidation(min, [
                'number',
                { name: 'belowMax', validator: (value, ruleValue, [maxValue]) => !value || !maxValue || Number(value) <= Number(maxValue), message: 'Must not exceed the maximum' },
            ], form, [max.value]);

            const [maxValue, setMax, maxControl] = useValidation(max, [
                'number',
                { name: 'aboveMin', validator: (value, ruleValue, [minValue]) => !value || !minValue || Number(value) >= Number(minValue), message: 'Must not be below the minimum' },
            ], form, [min.value]);

            Object.assign(probe, { form, minValue, maxValue, setMin, setMax, minControl, maxControl });
            return null;
        }

        setup(<Range />);

        act(() => probe.setMin('5'));
        act(() => probe.setMax('10'));
        expect(probe.form.isValid()).toBe(true);

        act(() => probe.setMin('20'));
        expect(probe.minControl.message()).toBe('Must not exceed the maximum');
        expect(probe.maxControl.message()).toBe('Must not be below the minimum');

        act(() => probe.setMax('30'));
        expect(probe.form.isValid()).toBe(true);
    });

    it('conditional fields: enabled with and without deps', async () => {
        function Company({ withDeps }) {
            const form = useValidationContext();
            const [hasCompany, setHasCompany] = useState(false);
            const [company] = withDeps
                ? useValidation('', ['required'], form, [], hasCompany)
                : useValidation('', ['required'], form, hasCompany);

            return (
                <>
                    <input aria-label="has company" type="checkbox" checked={hasCompany} onChange={event => setHasCompany(event.target.checked)} />
                    <output data-testid="status">{form.isValid() ? 'valid' : 'invalid'}|{company}</output>
                </>
            );
        }

        for (const withDeps of [true, false]) {
            const { user, unmount } = setup(<Company withDeps={withDeps} />);

            expect(screen.getByTestId('status').textContent).toBe('valid|');
            await user.click(screen.getByLabelText('has company'));
            expect(screen.getByTestId('status').textContent).toBe('invalid|');

            unmount();
        }
    });

    it('checkboxes and switches: requireChecked', async () => {
        function Terms() {
            const form = useValidationContext();
            const [accepted, setAccepted, termsControl] = useValidation(false, [{ name: 'requireChecked', message: 'Please accept the terms' }], form);

            return (
                <>
                    <input aria-label="terms" type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />
                    {termsControl.err() && <p role="alert">{termsControl.message()}</p>}
                </>
            );
        }

        const { user } = setup(<Terms />);
        expect(errors()).toEqual(['Please accept the terms']);

        await user.click(screen.getByLabelText('terms'));
        expect(errors()).toEqual([]);
    });

    it('numbers: validates numeric strings from text inputs', async () => {
        function Age() {
            const form = useValidationContext();
            const [age, setAge, ageControl] = useValidation('', ['required', 'integer', { name: 'min', value: 18 }, { name: 'max', value: 120 }], form);

            return (
                <>
                    <input aria-label="age" value={age} onChange={event => setAge(event.target.value)} />
                    {ageControl.err() && <p role="alert">{ageControl.message()}</p>}
                </>
            );
        }

        const { user } = setup(<Age />);
        const input = screen.getByLabelText('age');

        for (const [typed, expected] of [['17', ['min']], ['18.5', ['integer']], ['121', ['max']], ['abc', ['integer']], ['42', []]]) {
            await user.clear(input);
            await user.type(input, typed);
            expect(errors()).toEqual(expected);
        }
    });

    it('sharing the form with nested components: CheckoutForm', async () => {
        const onSubmit = vi.fn();

        function EmailField() {
            const [email, setEmail, control, onBlur] = usePValidation('', ['required', 'email']);

            return (
                <>
                    <input aria-label="email" value={email} onChange={event => setEmail(event.target.value)} onBlur={onBlur} />
                    {control.derr(true) && <p role="alert">{control.message()}</p>}
                </>
            );
        }

        function SubmitButton({ onSubmit }) {
            const form = usePValidationContext();

            return (
                <button
                    type="button"
                    onClick={() => {
                        form.setDirty();
                        if (form.isValid()) onSubmit();
                    }}
                >
                    Submit
                </button>
            );
        }

        function CheckoutForm({ onSubmit }) {
            return (
                <ValidationProvider>
                    <EmailField />
                    <SubmitButton onSubmit={onSubmit} />
                </ValidationProvider>
            );
        }

        const { user } = setup(<CheckoutForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole('button', { name: 'Submit' }));
        expect(errors()).toEqual(['required']);
        expect(onSubmit).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText('email'), 'ann@example.com');
        await user.click(screen.getByRole('button', { name: 'Submit' }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('errors from the server: addResult blocks submit until removed', async () => {
        const register = vi.fn(async () => ({ emailTaken: true }));

        function Register() {
            const form = useValidationContext();
            const [email, setEmail] = useValidation('', ['required', 'email'], form);

            const submit = async () => {
                form.setDirty();
                if (!form.isValid()) return;

                const response = await register(email);
                if (response.emailTaken) {
                    form.addResult('server', [{ name: 'emailTaken', message: 'This email is already registered' }]);
                }
            };

            const changeEmail = value => {
                form.removeResult('server');
                setEmail(value);
            };

            return (
                <>
                    <input aria-label="email" value={email} onChange={event => changeEmail(event.target.value)} />
                    {form.hasError('server') && <p role="alert">{form.getMessage('server')}</p>}
                    <output data-testid="status">{form.isValid() ? 'valid' : 'invalid'}</output>
                    <button type="button" onClick={submit}>Register</button>
                </>
            );
        }

        const { user } = setup(<Register />);

        await user.type(screen.getByLabelText('email'), 'ann@example.com');
        await user.click(screen.getByRole('button', { name: 'Register' }));
        expect(errors()).toEqual(['This email is already registered']);
        expect(screen.getByTestId('status').textContent).toBe('invalid');

        await user.type(screen.getByLabelText('email'), 'x');
        expect(errors()).toEqual([]);
        expect(screen.getByTestId('status').textContent).toBe('valid');
    });

    it('memoized components re-render when form.key is passed', async () => {
        const FormSummary = memo(function FormSummary({ form }) {
            return <p data-testid="summary">{form.isValid() ? 'Ready to submit' : 'Please fix the highlighted fields'}</p>;
        });

        function Form({ passKey }) {
            const form = useValidationContext();
            const [name, setName] = useValidation('', ['required'], form);

            return (
                <>
                    <input aria-label="name" value={name} onChange={event => setName(event.target.value)} />
                    {passKey ? <FormSummary form={form} version={form.key} /> : <FormSummary form={form} />}
                </>
            );
        }

        const { user, unmount } = setup(<Form passKey />);
        expect(screen.getByTestId('summary').textContent).toBe('Please fix the highlighted fields');
        await user.type(screen.getByLabelText('name'), 'Ann');
        expect(screen.getByTestId('summary').textContent).toBe('Ready to submit');
        unmount();

        setup(<Form passKey={false} />);
        expect(screen.getByTestId('summary').textContent).toBe('Ready to submit');
    });

    it('setPristine resets field dirty flags only when the form was dirty', async () => {
        const probe = {};

        function Field() {
            const form = useValidationContext();
            const [value, setValue, control, onBlur] = useValidation('', ['required'], form);
            Object.assign(probe, { form, control });
            return <input aria-label="field" value={value} onChange={event => setValue(event.target.value)} onBlur={onBlur} />;
        }

        const { user } = setup(<Field />);
        await user.click(screen.getByLabelText('field'));
        await user.tab();

        act(() => probe.form.setPristine());
        expect(probe.control.dirty).toBe(true);

        act(() => probe.form.setDirty());
        act(() => probe.form.setPristine());
        expect(probe.control.dirty).toBe(false);
    });

    it('validate on submit: a valid first submit resets blurred fields', async () => {
        const save = vi.fn();
        const probe = {};

        function Form() {
            const form = useValidationContext();
            const [name, setName, nameControl, onNameBlur] = useValidation('', ['required'], form);
            probe.nameControl = nameControl;

            const submit = () => {
                form.setDirty();

                if (!form.isValid()) {
                    return;
                }

                save(name);
                form.setPristine();
            };

            return (
                <>
                    <input aria-label="name" value={name} onChange={event => setName(event.target.value)} onBlur={onNameBlur} />
                    {nameControl.derr(true) && <p role="alert">{nameControl.message()}</p>}
                    <button onClick={submit}>Save</button>
                </>
            );
        }

        const { user } = setup(<Form />);
        await user.type(screen.getByLabelText('name'), 'Ann');
        await user.tab();
        expect(probe.nameControl.dirty).toBe(true);

        await user.click(screen.getByRole('button', { name: 'Save' }));
        expect(save).toHaveBeenCalledWith('Ann');
        expect(probe.nameControl.dirty).toBe(false);

        await user.clear(screen.getByLabelText('name'));
        expect(errors()).toEqual([]);
    });
});
