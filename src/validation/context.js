//global validation functions
let globalValidators = {
    required: function (value) {
        return (value === null || value === undefined || value === "") ? false : true;
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
        if (!value && value !== 0) return true;
        if (typeof value === "number") return true

        if (typeof value === "string") value = Number(value);
        return !Number.isNaN(value);
    },

    integer: function (value) {
        if (!value && value !== 0) return true;
        if (typeof value === "string") value = Number(value);

        return Number.isInteger(value);
    },

    min: function (value, min) {
        if ((!value && value !== 0) || (!min && min !== 0)) return true;

        const number = Number(value);
        if (!globalValidators.number(number)) return false;
        return number >= min;
    },

    max: function (value, max) {
        if ((!value && value !== 0) || (!max && max !== 0)) return true;

        const number = Number(value);
        if (!globalValidators.number(number)) return false;
        return number <= max;
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
        if (!value && value !== 0) return true;
        return value === equalValue;
    },

    pattern: function (value, pattern) {
        if (!value && value !== 0) return true;

        let flags = undefined;
        if (pattern.flags) {
            flags = pattern.flags;
            pattern = pattern.pattern;
        }

        const regex = new RegExp(pattern, flags);
        return regex.test(value);
    },

    email: function (value) {
        if (typeof value !== 'string') return false;
        if (!value) return true;

        return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])(|-|[A-Za-z0-9]+)))$/i
            .test(value);
    },

    url: function (value) {
        if (typeof value !== 'string') return false;
        if (!value) return true;

        return /^(?:http(s)?:\/\/)?(?:www\.)?[a-zA-Z0-9]+(?:[\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(?:[\/|\#|\?]\S*)?$/
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

export function createValidationContext() {
    return {
        key: '',
        dirty: false,
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
                        }
                    };
                }
            };
        },

        notify: function (key) {
            if (!key) key = '';

            for (const event of this.events) {
                if (key && event.key && event.key !== key) continue;

                event.fn(key);
            }
        },

        setDirty: function () {
            this.dirty = true;

            this.notify();
            return this;
        },

        setPristine: function () {
            this.dirty = false;

            this.notify();
            return this;
        },

        addResult: function (key, results) {
            this.results.set(key, results);
            this.notify(key);

            return this;
        },

        removeResult: function (key) {
            this.results.delete(key);
            this.notify(key);

            return this;
        },

        getState: function (key) {
            const errors = this.results.get(key);
            if (!errors) return {};

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