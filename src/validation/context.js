//global validation functions
const isEmpty = value => value === null || value === undefined || value === '';

const toNumber = value => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') return Number(value);
    return NaN;
};

let globalValidators = {
    required: function (value) {
        return !isEmpty(value);
    },

    requiredIf: function (value, ifCase) {
        if (!ifCase) return true;
        return globalValidators.required(value);
    },

    requireChecked: function (value) {
        if (typeof value === 'string') return value === "true";
        return !!value;
    },

    number: function (value) {
        if (isEmpty(value)) return true;
        return !Number.isNaN(toNumber(value));
    },

    integer: function (value) {
        if (isEmpty(value)) return true;
        return Number.isInteger(toNumber(value));
    },

    min: function (value, min) {
        if (isEmpty(value) || (!min && min !== 0)) return true;
        if (!globalValidators.number(value)) return false;

        return Number(value) >= min;
    },

    max: function (value, max) {
        if (isEmpty(value) || (!max && max !== 0)) return true;
        if (!globalValidators.number(value)) return false;

        return Number(value) <= max;
    },

    minLength: function (value, length) {
        if (!value) return true;
        return value.length >= length;
    },

    maxLength: function (value, length) {
        if (!value) return true;
        return value.length <= length;
    },

    equals: function (value, equalValue) {
        if (isEmpty(value)) return true;
        return value === equalValue;
    },

    pattern: function (value, pattern) {
        if (isEmpty(value)) return true;

        let flags = undefined;
        if (pattern && typeof pattern === 'object' && !(pattern instanceof RegExp)) {
            flags = pattern.flags;
            pattern = pattern.pattern;
        }

        const regex = new RegExp(pattern, flags);
        return regex.test(value);
    },

    email: function (value) {
        if (isEmpty(value)) return true;
        if (typeof value !== 'string') return false;
        if (value.length > 254) return false;

        return /^((([a-z]|\d|[!#$%&'*+\-/=?^_`{|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#$%&'*+\-/=?^_`{|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])(|-|[A-Za-z0-9]+)))$/i
            .test(value);
    },

    url: function (value) {
        if (isEmpty(value)) return true;
        if (typeof value !== 'string') return false;

        return /^(?:https?:\/\/)?(?:localhost|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59}))(?::(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|\d{1,4}))?(?:[/?#]\S*)?$/i
            .test(value);
    }
};

//global convert functions
let globalConverts = {
    trim: function (value) {
        if (typeof value !== "string")
            value = value?.toString();

        if (!value) return value;
        return value.trim();
    },

    upper: function (value) {
        if (typeof value !== "string")
            value = value?.toString();

        if (!value) return value;
        return value.toUpperCase();
    },

    lower: function (value) {
        if (typeof value !== "string")
            value = value?.toString();

        if (!value) return value;
        return value.toLowerCase();
    }
}

//configure defaults
export const validationConfig = {
    get validators() {
        return globalValidators;
    },

    set validators(validation) {
        globalValidators = { ...globalValidators, ...validation }
    },

    get converts() {
        return globalConverts;
    },

    set converts(converts) {
        globalConverts = { ...globalConverts, ...converts }
    },
};

//validate value using rules
export function validateValue(value, rules, deps) {
    if (!rules) return null;
    const errors = [];

    for (const rule of rules) {
        if (!rule) continue;

        let ruleName;
        let ruleMessage;
        let ruleValue;
        let validator;

        if (typeof rule === 'string') {
            ruleName = rule;
            ruleMessage = rule;
        }
        else {
            ruleName = rule.name;
            ruleMessage = rule.message || rule.name;
            validator = rule.validator;

            ruleValue = rule.value;
            if (typeof ruleValue === 'function') ruleValue = ruleValue(deps);

            if (rule.convert) {
                if (typeof rule.convert === 'function') value = rule.convert(value, ruleValue, deps);
                else if (typeof rule.convert === 'string') {
                    if (rule.convert in globalConverts)
                        value = globalConverts[rule.convert](value, ruleValue, deps);
                }
                else {
                    for (const conv in rule.convert) {
                        if (!conv || !rule.convert[conv]) continue;

                        if (typeof rule.convert[conv] === 'function') value = rule.convert[conv](value, ruleValue, deps);
                        else if (conv in globalConverts) value = globalConverts[conv](value, ruleValue, deps);
                    }
                }
            }
        }

        if (!validator) validator = globalValidators[ruleName];
        if (!validator) continue;

        if (!validator(value, ruleValue, deps))
            errors.push({ name: ruleName, message: ruleMessage });
    }

    return errors.length ? errors : null;
}

function sameResults(current, next) {
    if (!current || !next || current.length !== next.length) return false;

    return current.every((result, index) => result.name === next[index].name && result.message === next[index].message);
}

export const resetCount = Symbol();

export function createValidationContext() {
    return {
        key: 0,
        dirty: false,
        [resetCount]: 0,
        results: new Map(),
        events: [],

        on: function (key) {
            if (!key) key = '';

            return {
                subscribe: (fn) => {
                    const event = { key, fn };
                    this.events.push(event);

                    return {
                        unsubscribe: () => {
                            const index = this.events.indexOf(event);

                            if (index === -1) return;
                            this.events.splice(index, 1);
                            event.removed = true;
                        }
                    };
                }
            };
        },

        notify: function (key) {
            if (!key) key = '';

            this.key++;
            if (this.key > 10000000) {
                this.key = 0;
            }

            for (const event of [...this.events]) {
                if (event.removed) continue;
                if (key && event.key && event.key !== key) continue;

                event.fn(key);
            }
        },

        setDirty: function () {
            if (this.dirty) return this;
            this.dirty = true;

            this.notify();
            return this;
        },

        setPristine: function () {
            if (!this.dirty) return this;
            this.dirty = false;
            this[resetCount]++;

            this.notify();
            return this;
        },

        addResult: function (key, results) {
            const current = this.results.get(key);
            if (current !== results && sameResults(current, results)) return this;

            this.results.set(key, results);
            this.notify(key);

            return this;
        },

        removeResult: function (key) {
            if (!this.results.has(key)) return this;

            this.results.delete(key);
            this.notify(key);

            return this;
        },

        getState: function (key) {
            const errors = this.results.get(key);
            if (!errors) return { valid: true, errors: {} };

            const valid = !errors.length > 0;
            const state = { valid, errors: {} };

            for (const error of errors || []) {
                state.errors[error.name] = { message: error.message };
            }

            return state;
        },

        getMessage: function (key, rule) {
            const state = this.getState(key);
            if (!state.errors) return "";

            let message = '';
            if (rule && rule in state.errors) {
                message = state.errors[rule].message;
            }
            else {
                for (const prop in state.errors) {
                    message = state.errors[prop].message;
                    break;
                }
            }

            return message;
        },

        hasError: function (key, rule = null) {
            const state = this.getState(key);
            if (!rule) return state.valid === undefined ? false : !state.valid;

            if (!state.errors) return false;
            return state.errors[rule] || false;
        },

        isValid: function () {
            const keys = this.results.keys();
            for (const key of keys) {
                if (this.results.get(key).length) return false;
            }

            return true;
        }
    };
}