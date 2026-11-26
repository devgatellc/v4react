# v4react

Form validation hooks for **React**, **React Native** and **Expo**. Validate any input — a text field, a checkbox, a custom component — without a `<form>` element and without a schema library. Each field gets its value, its setter and a validation control from a single hook, and the whole form shares one validation context.

- Works the same on the web, in React Native and in Expo
- One hook per field, similar to `useState`
- Built-in rules for the common cases, custom rules in one line
- Show errors after submit, after blur, or both
- Conditional fields, cross-field rules and shared values
- TypeScript types included
- No dependencies besides React

## Contents

- [Installation](#installation)
- [Requirements](#requirements)
- [Quick start (web)](#quick-start-web)
- [Quick start (React Native and Expo)](#quick-start-react-native-and-expo)
- [How it works](#how-it-works)
- [Rules](#rules)
- [Showing errors](#showing-errors)
- [Recipes](#recipes)
- [API reference](#api-reference)
- [TypeScript](#typescript)
- [Server-side rendering](#server-side-rendering)
- [Development](#development)

## Installation

```bash
npm install v4react
```

## Requirements

| | Supported |
| --- | --- |
| React | 18 and 19 |
| React Native | 0.69 or newer (the first release on React 18) |
| Expo | SDK 46 or newer. v4react has no native code, so it works in Expo Go without a development build |
| Bundlers | Metro, Vite, webpack 5, Next.js, esbuild and anything else that understands ES modules |
| Node.js (server rendering, tests) | `import` works everywhere; `require('v4react')` needs Node 20.19+ or 22.12+ |
| TypeScript | 4.3 or newer; the types ship with the package |

v4react is published as an ES module.

## Quick start (web)

```jsx
import { useValidation, useValidationContext } from 'v4react';

export function SignUpForm() {
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
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} onBlur={onEmailBlur} />
            {emailControl.derr(true) && <p className="error">{emailControl.message()}</p>}

            <input type="password" value={password} onChange={event => setPassword(event.target.value)} onBlur={onPasswordBlur} />
            {passwordControl.derr(true) && <p className="error">{passwordControl.message()}</p>}

            <button type="submit">Sign up</button>
        </form>
    );
}
```

- `useValidationContext()` creates the form's validation context.
- `useValidation(initialValue, rules, form)` works like `useState`, and also returns a **control** for reading errors and an **`onBlur`** handler.
- `form.setDirty()` marks the form as submitted, and `form.isValid()` tells you whether every field passed.
- `control.derr(true)` is true when the field has an error **and** the user either left the field or tried to submit. See [Showing errors](#showing-errors) for the other options.

A `<form>` element is optional; the hooks don't depend on one.

## Quick start (React Native and Expo)

The API is identical. `onChangeText` passes the new text directly, so the setter can be used as is:

```jsx
import { Pressable, Text, TextInput, View } from 'react-native';
import { useValidation, useValidationContext } from 'v4react';

export function SignInScreen() {
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
        <View>
            <TextInput
                value={email}
                onChangeText={setEmail}
                onBlur={onEmailBlur}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
            />
            {emailControl.derr(true) && <Text style={{ color: 'crimson' }}>{emailControl.message()}</Text>}

            <TextInput
                value={password}
                onChangeText={setPassword}
                onBlur={onPasswordBlur}
                placeholder="Password"
                secureTextEntry
            />
            {passwordControl.derr(true) && <Text style={{ color: 'crimson' }}>{passwordControl.message()}</Text>}

            <Pressable onPress={submit}>
                <Text>Sign in</Text>
            </Pressable>
        </View>
    );
}
```

Other React Native inputs work the same way, for example `<Switch value={accepted} onValueChange={setAccepted} />` with the `requireChecked` rule.

## How it works

**The context** holds the validation results of every field and the form's *dirty* flag. Create it with `useValidationContext()` in the component that owns the form, or with `<ValidationProvider>` to share it with nested components. Components that use the context re-render when results or the dirty flag change.

**Each field** is a `useValidation` call. It keeps the field's value in React state, validates it against its rules and stores the result in the context under the control's unique key.

**When validation runs.** A field is validated when it mounts, and again whenever

- its value changes,
- an item in its `deps` array changes (compared one by one, like the dependency list of `useEffect`),
- it is enabled or disabled, or
- its own dirty flag changes.

Rules are read every time validation runs, but changing only the rules does not trigger validation. When a rule depends on another value, put that value in `deps` (see [Cross-field rules](#cross-field-rules)), or call `control.validate()` yourself.

**Cleanup.** When a field unmounts or is disabled, its result is removed from the context, so it no longer affects `form.isValid()`.

## Rules

`rules` is an array. Each rule is either the name of a validator or an object:

```js
['required', 'email']

[
    'required',
    { name: 'minLength', value: 3 },
    { name: 'maxLength', value: 20, message: 'Keep it under 20 characters' },
]
```

| Property | Description |
| --- | --- |
| `name` | Validator name. Also used as the error key and as the default message. |
| `value` | Rule value passed to the validator, for example the minimum length. Can be a function `(deps) => value`. |
| `message` | Error message. Defaults to `name`. |
| `validator` | Custom validator `(value, ruleValue, deps) => boolean`. Return `true` when the value is valid. |
| `convert` | Transform the value before this rule checks it. See [Converts](#converts). |

Rules run in order. Every rule that fails is reported, and `control.message()` returns the message of the first one.

### Built-in validators

Empty values (`null`, `undefined` and `''`) pass every validator except `required`, `requiredIf` and `requireChecked`. That keeps optional fields optional: add `required` when a field must be filled in.

| Rule | Rule value | Passes when |
| --- | --- | --- |
| `required` | — | the value is not `null`, `undefined` or `''`. `0` and `false` count as filled in. |
| `requiredIf` | condition | the condition is falsy, or the value is filled in |
| `requireChecked` | — | the value is `true` or `'true'`, for checkboxes and switches |
| `number` | — | the value is a number or a numeric string (`'5'`, `'-1.5'`, `'1e3'`) |
| `integer` | — | the value is a whole number or a whole-number string |
| `min` | minimum | the value, as a number, is at least the minimum |
| `max` | maximum | the value, as a number, is at most the maximum |
| `minLength` | length | the string or array has at least `length` items |
| `maxLength` | length | the string or array has at most `length` items |
| `equals` | expected value | the value is strictly equal (`===`) to the expected value |
| `pattern` | `'regex'`, a `RegExp`, or `{ pattern, flags }` | the value matches the regular expression |
| `email` | — | the value is a valid email address of at most 254 characters. Non-string values fail. |
| `url` | — | the value is a web address: `http://` or `https://` or no scheme, a domain, `localhost` or an IPv4 address, an optional port (0–65535) and an optional path. Non-string values fail. |

```js
{ name: 'requiredIf', value: hasCompany }
{ name: 'min', value: 18, message: 'You must be at least 18' }
{ name: 'pattern', value: '^[A-Z]{2}\\d{6}$', message: 'Use the format AB123456' }
{ name: 'pattern', value: { pattern: '^[a-z]+$', flags: 'i' } }
{ name: 'pattern', value: /^[a-z]+$/i }
```

### Custom validators

Add a `validator` function to a rule. Return `true` for valid values, and let empty values pass unless the rule is about being filled in:

```js
const strongPassword = {
    name: 'strongPassword',
    validator: value => !value || (/[A-Z]/.test(value) && /\d/.test(value)),
    message: 'Use an uppercase letter and a number',
};

useValidation('', ['required', strongPassword], form);
```

A custom `validator` with the name of a built-in replaces the built-in for that rule.

To reuse a validator everywhere, register it once when your app starts:

```js
import { validationConfig } from 'v4react';

validationConfig.validators = {
    phone: value => !value || /^\+?\d{7,15}$/.test(value),
    notIn: (value, list) => !list.includes(value),
};
```

```js
useValidation('', ['required', 'phone'], form);
useValidation('', [{ name: 'notIn', value: ['admin', 'root'], message: 'This name is reserved' }], form);
```

Assigning to `validationConfig.validators` adds to the existing validators; it does not remove the built-ins. Registering a name that already exists replaces that validator for the whole app.

### Converts

`convert` changes the value a rule sees. The field's state is not changed.

```js
{ name: 'required', convert: 'trim' }
{ name: 'equals', value: 'YES', convert: 'upper' }
{ name: 'minLength', value: 7, convert: value => String(value).replace(/\D/g, '') }
{ name: 'equals', value: 'abc', convert: { trim: true, lower: true } }
```

| Form | Meaning |
| --- | --- |
| `'trim'`, `'upper'`, `'lower'` | a built-in or registered convert, by name |
| `(value, ruleValue, deps) => newValue` | a function |
| `{ trim: true, custom: value => ... }` | several converts, applied in order. Use `true` for a registered convert, or a function. |

The converted value is also used by the rules that come after it in the same list.

Register reusable converts like validators:

```js
validationConfig.converts = {
    digits: value => String(value ?? '').replace(/\D/g, ''),
};
```

### Rule values that depend on other values

A rule value can be a function of the `deps` array. Together with `deps`, this keeps the rule up to date:

```js
const [password, setPassword] = useValidation('', ['required'], form);
const [confirm, setConfirm, confirmControl] = useValidation('', [
    'required',
    { name: 'equals', value: deps => deps[0], message: 'Passwords do not match' },
], form, [password]);
```

Custom validators receive `deps` as their third argument: `(value, ruleValue, deps) => boolean`.

## Showing errors

There are two dirty flags:

- **The form** becomes dirty when you call `form.setDirty()`, usually when the user submits.
- **A field** becomes dirty when its `onBlur` handler runs (the user left the field) or when you call `control.setDirty()`.

`control.derr()` ("dirty error") combines a field's errors with these flags, so errors only show up once the user is done with a field:

| Call | Shows the error when |
| --- | --- |
| `derr()` | the form is dirty (after submit) |
| `derr(false)` | the field is dirty (after blur) |
| `derr(true)` | the form **or** the field is dirty (after blur or submit) |
| `derr('rule')`, `derr('rule', false)`, `derr('rule', true)` | the same, for one rule only |
| `err()`, `err('rule')` | always, regardless of dirty flags |

```jsx
{nameControl.derr(true) && <p>{nameControl.message()}</p>}

{passwordControl.derr('minLength', true) && <p>{passwordControl.message('minLength')}</p>}
{passwordControl.derr('strongPassword', true) && <p>{passwordControl.message('strongPassword')}</p>}
```

`form.setPristine()` resets the form's dirty flag. When the form was dirty, it also resets the dirty flag of every field, for example after a successful submit. To reset a single field, call `control.setPristine()`.

## Recipes

### Validate on submit

```js
const submit = () => {
    form.setDirty();

    if (!form.isValid()) {
        return;
    }

    save();
    form.setPristine();
};
```

Fields validate in an effect after each render, so `form.isValid()` reflects the values of the last render. In a submit handler, that includes everything the user typed before clicking. It does not include a value you set earlier in the same handler, because that value only reaches the field on the next render. Check such a value with [`validateValue`](#validatevaluevalue-rules-deps) instead, or normalize it in `onChange`.

### Cross-field rules

Put the other value in `deps`. The field re-validates when it changes, even if its own value didn't:

```js
const [startDate, setStartDate] = useValidation('', ['required'], form);
const [endDate, setEndDate, endControl] = useValidation('', [
    'required',
    {
        name: 'afterStart',
        validator: (end, ruleValue, [start]) => !end || !start || end >= start,
        message: 'The end date must be after the start date',
    },
], form, [startDate]);
```

### Fields that depend on each other

When two fields need each other's value, create the values first with `useValidationValue` and pass them to `useValidation` instead of an initial value:

```js
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
```

Several `useValidation` calls can also share one value this way. They all return the same value and setter, but each has its own rules and control.

### Conditional fields

Pass `enabled` to skip validation. While a field is disabled, its result is removed from the form and its dirty flag is reset:

```js
const [hasCompany, setHasCompany] = useState(false);
const [company, setCompany, companyControl] = useValidation('', ['required'], form, [], hasCompany);
```

When you don't need `deps`, `enabled` can take its place:

```js
useValidation('', ['required'], form, hasCompany);
```

`enabled` can also be a function of the field's value: `value => value !== 'n/a'`.

### Checkboxes and switches

```jsx
const [accepted, setAccepted, termsControl] = useValidation(false, [{ name: 'requireChecked', message: 'Please accept the terms' }], form);

<input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />
<Switch value={accepted} onValueChange={setAccepted} />
```

### Numbers

Text inputs return strings. `number`, `integer`, `min` and `max` accept numeric strings, so you can validate the raw input and convert it when you save:

```js
const [age, setAge, ageControl] = useValidation('', ['required', 'integer', { name: 'min', value: 18 }, { name: 'max', value: 120 }], form);
```

### Sharing the form with nested components

`ValidationProvider` creates a context and makes it available to everything inside it. Fields use `usePValidation`, which takes the same arguments as `useValidation` without the context, and any component can read the form with `usePValidationContext`:

```jsx
import { usePValidation, usePValidationContext, ValidationProvider } from 'v4react';

function EmailField() {
    const [email, setEmail, control, onBlur] = usePValidation('', ['required', 'email']);

    return (
        <>
            <input value={email} onChange={event => setEmail(event.target.value)} onBlur={onBlur} />
            {control.derr(true) && <p>{control.message()}</p>}
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

export function CheckoutForm({ onSubmit }) {
    return (
        <ValidationProvider>
            <EmailField />
            <SubmitButton onSubmit={onSubmit} />
        </ValidationProvider>
    );
}
```

Each `ValidationProvider` is independent, so several forms can live on the same screen.

### Errors from the server

Add your own results to the context with `addResult`. They count towards `form.isValid()` like field errors:

```js
const submit = async () => {
    form.setDirty();
    if (!form.isValid()) return;

    const response = await api.register(email);
    if (response.emailTaken) {
        form.addResult('server', [{ name: 'emailTaken', message: 'This email is already registered' }]);
    }
};

const changeEmail = value => {
    form.removeResult('server');
    setEmail(value);
};
```

```jsx
{form.hasError('server') && <p>{form.getMessage('server')}</p>}
```

### Memoized components

The context object never changes identity, so a component wrapped in `React.memo` that only receives `form` won't re-render when validation changes. Pass `form.key` as well; it changes whenever results or dirty flags change:

```jsx
const FormSummary = memo(function FormSummary({ form }) {
    return <p>{form.isValid() ? 'Ready to submit' : 'Please fix the highlighted fields'}</p>;
});

<FormSummary form={form} version={form.key} />
```

### Validating outside React

`validateValue` runs rules without React, which is useful on the server or in tests:

```js
import { validateValue } from 'v4react';

validateValue('ab', ['required', { name: 'minLength', value: 3 }]);
```

It returns `null` when every rule passes, otherwise the failed rules: `[{ name: 'minLength', message: 'minLength' }]`.

`createValidationContext()` creates a context outside React, with the same API as the one returned by `useValidationContext()`. It does not re-render components by itself.

## API reference

### `useValidationContext()`

Creates a validation context for the calling component and returns it. The component re-renders when validation results or dirty flags change. The returned object is the same on every render.

### `useValidation(initialValue, rules, context, deps?, enabled?)`

```ts
const [value, setValue, control, onBlur] = useValidation(initialValue, rules, context, deps, enabled);
```

| Argument | Description |
| --- | --- |
| `initialValue` | Initial value, a function returning it (like `useState`), or a value from `useValidationValue` |
| `rules` | Array of [rules](#rules) |
| `context` | The context from `useValidationContext()` or `createValidationContext()` |
| `deps` | Optional array of values. The field re-validates when any of them changes, and rule functions receive it. |
| `enabled` | Optional boolean or `(value) => boolean`. Disabled fields are not validated. Can be passed in place of `deps`. |

| Returns | Description |
| --- | --- |
| `value` | Current value |
| `setValue` | Setter, accepts a value or `previous => next` like `useState` |
| `control` | The field's [validation control](#validation-control) |
| `onBlur` | Marks the field as dirty. Pass it to the input's `onBlur`. |

### `useValidationValue(initialValue)`

Creates a value before it is passed to `useValidation`, for fields that depend on each other or share a value. Returns `{ value }`. Pass the returned object as the `initialValue` of `useValidation`.

### `ValidationProvider`

Component that creates a validation context for its children.

### `usePValidation(initialValue, rules, deps?, enabled?)`

`useValidation` for components inside a `ValidationProvider`; it uses the provider's context.

### `usePValidationContext()`

Returns the context of the nearest `ValidationProvider`. The component re-renders when validation results or dirty flags change.

### Validation control

Returned as the third item by `useValidation` and `usePValidation`.

| Member | Description |
| --- | --- |
| `key` | Unique string identifying the field in the context |
| `value` | Current value |
| `rules` | Rules of the last committed render, for use in effects and event handlers. During render it can still hold the previous rules, so render from the `rules` you passed to `useValidation` instead. |
| `dirty` | Whether the field is dirty |
| `err(rule?)` | Without a rule: whether the field has any error. With a rule: the error `{ message }` if that rule failed, otherwise `false`. |
| `derr(rule?, mode?)` | Like `err`, but only reports errors once the form and/or field is dirty. See [Showing errors](#showing-errors). The mode can be passed as the first argument. |
| `message(rule?)` | Message of the given rule, or of the first error. Empty string when the field is valid. |
| `validate()` | Validates the field now with its current rules |
| `setDirty()` | Marks the field as dirty |
| `setPristine()` | Marks the field as not dirty |

### Validation context

Returned by `useValidationContext`, `usePValidationContext` and `createValidationContext`.

| Member | Description |
| --- | --- |
| `isValid()` | `true` when no field or custom result has errors |
| `dirty` | Whether the form is dirty |
| `setDirty()` | Marks the form as dirty. Returns the context. |
| `setPristine()` | Marks the form as not dirty. If the form was dirty, all of its fields are marked as not dirty too. Returns the context. |
| `key` | Number that changes whenever results or dirty flags change |
| `getState(key)` | `{ valid, errors }` for a field or custom result. `errors` maps rule names to `{ message }`. Unknown keys return `{ valid: true, errors: {} }`. |
| `getMessage(key, rule?)` | Message of the given rule, or of the first error |
| `hasError(key, rule?)` | Without a rule: whether the key has any error. With a rule: the error `{ message }` or `false`. |
| `addResult(key, results)` | Stores `[{ name, message }]` under `key`. Returns the context. |
| `removeResult(key)` | Removes the result stored under `key`. Returns the context. |
| `on(key?).subscribe(listener)` | Calls `listener(key)` on every change. With a key, only on changes to that key and on form-wide changes such as the dirty flag. Returns `{ unsubscribe }`. |
| `notify(key?)` | Notifies subscribers and re-renders the components that use the context |

Field keys are available as `control.key`.

### `validateValue(value, rules, deps?)`

Runs rules against a value. Returns `null` when every rule passes, otherwise an array of `{ name, message }`.

### `createValidationContext()`

Creates a context outside React. See [Validating outside React](#validating-outside-react).

### `validationConfig`

| Property | Description |
| --- | --- |
| `validators` | All validators. Assigning an object adds or replaces validators by name. |
| `converts` | All converts. Assigning an object adds or replaces converts by name. |

## TypeScript

Types are included. The value type is inferred from the initial value:

```ts
import { useValidation, useValidationContext } from 'v4react';
import type { ValidationRule } from 'v4react';

const form = useValidationContext();
const [age, setAge, ageControl] = useValidation<string>('', ['required', 'integer'], form);

const passwordRules: ValidationRule[] = [
    'required',
    { name: 'minLength', value: 8, message: 'Use at least 8 characters' },
];
```

Exported types: `ValidationContext`, `ValidationControl<S>`, `ValidationValue<S>` (returned by `useValidationValue`), `ValidationRule`, `ValidationConvert`, `ValidationResult`, `ValidationValidator`, `ValidationConverter`, `ValidationValidators`, `ValidationConverters`, `ValidationConfig` and `ValidationSubscription`.

`err` and `derr` are typed as `boolean`. To read a message, use `control.message(rule)`.

## Server-side rendering

v4react works with server rendering, for example in Next.js. Validation runs in effects, which don't run on the server, so the server HTML shows the form without validation results. Fields validate as soon as the page hydrates in the browser.

## Development

```bash
npm install
npm test
```

`npm test` runs the whole suite: the core tests, every React test once on React 18 and once on React 19 (in normal mode and in `StrictMode`), and the type tests. The React 18 packages live in `test/react18` and are installed automatically on the first run.

| Script | Description |
| --- | --- |
| `npm test` | Run all tests once |
| `npm run test:watch` | Re-run tests on changes |
| `npm run test:coverage` | Run all tests with a coverage report and minimum coverage thresholds |
| `npm run lint` | Lint the source |

## License

MIT
