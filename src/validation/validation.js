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
        if (typeof value == 'string') return value == "true";
        return value;
    },

    email: function (value) {
        if (!value) return true;

        return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])(|-|[A-Za-z0-9]+)))$/i
            .test(value);
    },

    url: function (value) {
        if (!value) return true;

        return /^(?:http(s)?:\/\/)?(?:www\.)?[a-zA-Z0-9]+(?:[\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(?:[\/|\#|\?]\S*)?$/
            .test(value);
    },

    min: function (value, min) {
        if ((!value && value !== 0) || (!min && min !== 0)) return true;

        let number = Number(value);
        if (!globalValidators.number(number)) return false;
        return number >= min;
    },

    max: function (value, max) {
        if ((!value && value !== 0) || (!max && max !== 0)) return true;

        let number = Number(value);
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
        if (!value) return true;
        return value === equalValue;
    },

    number: function (value) {
        if (!value && value !== 0) return true;
        if (typeof value == "number") return true

        if (typeof value == "string") value = Number(value);
        return !Number.isNaN(value);
    },

    integer: function (value) {
        if (!value && value !== 0) return true;
        if (typeof value == "string") value = Number(value);

        return Number.isInteger(value);
    },

    pattern: function (value, pattern) {
        if (!value) return true;

        let flags = undefined;
        if (pattern.flags) {
            flags = pattern.flags;
            pattern = pattern.pattern;
        }

        let regex = new RegExp(pattern, flags);
        return regex.test(value);
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

    get notifyTime() {
        return this.time || 10;
    },

    set notifyTime(time) {
        this.time = time;
    }
};

//generate unique key
export function unique_key() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

//validate value using rules
export function validateValue(value, rules) {
    if (!rules) return null;
    let errors = [];

    for (let rule of rules) {
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
            if (typeof ruleValue == 'function') ruleValue = ruleValue();

            if (rule.convert) {
                if (typeof rule.convert == 'function') value = rule.convert(value, ruleValue);
                else {
                    for (const conv in rule.convert) {
                        if (!conv) continue;

                        if (typeof conv == 'function') value = conv(value, ruleValue);
                        else if (conv in globalConverts) value = globalConverts[conv](value, ruleValue);
                    }
                }
            }
        }

        if (!validator) validator = globalValidators[ruleName];
        if (!validator) continue;

        if (!validator(value, ruleValue))
            errors.push({ name: ruleName, message: ruleMessage });
    }

    return errors.length ? errors : null;
}

export class ValidationContext {
    constructor() {
        this.dirty = false;
        this.results = [];
        this.events = [];
        this.eventCache = [];
    }

    on(keys) {
        if (!keys) keys = '';

        return {
            subscribe: (fn) => {
                if (!Array.isArray(keys)) keys = [keys];
                let events = [];

                for (let key of keys) {
                    let event = { key, fn };
                    events.push(event);
                    this.events.push(event);
                }

                return {
                    unsubscribe: () => {
                        for (let event of events) {
                            let index = this.events.indexOf(event);
                            if (index == -1) return;
                            this.events.splice(index, 1);
                        }
                    }
                };
            }
        };
    }

    notify(sync, key) {
        if (!key) this.eventCache = [''];
        else if (this.eventCache.indexOf(key) === -1) this.eventCache.push(key);

        let exec = () => {
            for (let event of this.events) {
                if (this.eventCache[0] && event.key && this.eventCache.indexOf(event.key) === -1) continue;
                event.fn(event.key);
            }
            this.eventCache = [];
        }
        if (this.timeOut) clearTimeout(this.timeOut);

        if (sync) exec();
        else this.timeOut = setTimeout(exec, validationConfig.notifyTime);
    }

    setDirty(leaveCustom, sync) {
        this.dirty = true;
        this.results.forEach(result => {
            result.dirty = true;
        });

        if (!leaveCustom) this.removeCustomErrors();
        this.notify(sync);
        return this;
    }

    setPristine(leaveCustom, sync) {
        this.dirty = false;
        this.results.forEach(result => {
            result.dirty = false;
        });

        if (!leaveCustom) this.removeCustomErrors();
        this.notify(sync);
        return this;
    }

    addResult(result, sync) {
        let index = this.results.findIndex(item => item.key == result.key);

        if (index > -1) this.results[index] = result;
        else this.results.push(result);

        this.notify(sync, result.key);
        return this;
    }

    removeResult(key, sync) {
        let index = this.results.findIndex(item => item.key == key);
        if (index > -1) this.results.splice(index, 1);

        this.notify(sync, key);
        return this;
    }

    addError(error, sync) {
        let name = typeof error == "string" ? error : error.name;
        let message = typeof error == "string" ? error : error.message;

        return this.addResult({
            key: name,
            custome: true,
            errors: [{ name, message }]
        }, sync);
    }

    removeError(error, sync) {
        return this.removeResult(error, sync);
    }

    removeCustomErrors(sync) {
        let results = this.results.filter(x => !x.custome);

        if (this.results.length != results.length) {
            this.results = results;
            this.notify(sync);
        }
        return this;
    }

    getState(key) {
        let item = this.results.find(item => item.key == key);
        if (!item) return {};

        let dirty = item.dirty;
        let valid = !(item.errors && item.errors.length > 0);

        let state = { valid, dirty, errors: {} };
        for (let error of item.errors || []) {
            state.errors[error.name] = { message: error.message };
        }

        return state;
    }

    getMessage(key, rule) {
        let state = this.getState(key);
        if (!state.errors) return "";

        let message = '';
        if (rule && rule in state.errors) {
            message = state.errors[rule].message;
        }
        else {
            for (let prop in state.errors) {
                message = state.errors[prop].message;
                break;
            }
        }

        if (typeof message == "function")
            message = message();

        return message;
    }

    hasError(key, rule = null, dirty) {
        let state = this.getState(key);
        if (dirty !== undefined && state.dirty !== dirty) return false;

        if (!rule) return state.valid === undefined ? false : !state.valid;

        if (!state.errors) return false;
        return state.errors[rule] || false;
    }

    isValid(skipCustom) {
        let errors = this.results.filter(x => (!skipCustom || !x.custome)).flatMap(x => x.errors || []);
        return !errors.length;
    }
}