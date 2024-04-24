import { ValidationContext, unique_key, validateValue } from './validation';


function createValueModel(structValue, context, overrideDefault = undefined) {
    const [defaultValue, ...rules] = structValue;
    const key = unique_key();
    let element = null, value = overrideDefault !== undefined ? overrideDefault : defaultValue;
    const validateModelOnChange = !!rules.length && rules[rules.length - 1] === true && rules.pop();

    const obj = {
        get key() { return key; },
        get rules() { return rules; },

        get element() { return element; },
        set element(el) {
            element = el;

            if (!el) context.removeResult(key, false);
            else this.validate(false);
        },

        get value() { return value; },
        set value(val) {
            if (value === val) return;

            value = val;
            this.validate(true);

            if (validateModelOnChange)
                context.validate();
        },

        setValue(val) {
            value = val;
        },

        validate: sync => {
            const errors = validateValue(value, rules);

            if (element)
                context.addResult({ key, errors }, sync === undefined ? true : sync);
            else
                context.removeResult(key, sync === undefined ? true : sync);

            return !errors;
        },

        err: (rule, dirty = true) => {
            if (rule === false) {
                rule = undefined;
                dirty = null;
            }

            if (dirty !== null && context.dirty !== dirty) return false;
            return context.hasError(key, rule);
        },

        message: (rule) => {
            return context.getMessage(key, rule);
        }
    };

    obj.ref = el => { obj.element = el; };
    return obj;
}

function processStructure(model, prop, structValue, context, defaultModel = undefined) {
    let modelValue = model[prop];
    const defaultValue = defaultModel ? defaultModel[prop] : undefined;

    let type = 'object';
    if (Array.isArray(structValue)) type = 'value';

    if (modelValue === undefined) {
        if (type === 'value') modelValue = createValueModel(structValue, context, defaultValue);
        else modelValue = {};
    }

    Object.defineProperty(model, prop, {
        get: function () { return modelValue; },
        set: function (val) {
            if (type === 'value') modelValue.value = val;
            else throw new Error('Invalid Operation');
        }
    });

    if (type === 'object') {
        for (let p in structValue)
            processStructure(modelValue, p, structValue[p], context, defaultValue);
    }
}

export class ModelValidationContext extends ValidationContext {
    constructor(structure) {
        super();

        const controls = {};
        for (const prop in structure)
            processStructure(controls, prop, structure[prop], this);

        Object.freeze(controls);
        Object.defineProperty(this, 'controls', { get: function () { return controls; } });
    }

    validate(leaveCustom) {
        this.results = leaveCustom ? this.results.filter(x => x.custome) : [];
        const fn = (model) => {
            if (!model) return;

            if (model.key && typeof model.key === "string" && model.validate) {
                model.validate(false);
                return;
            }

            for (let prop of Object.getOwnPropertyNames(model))
                fn(model[prop]);
        }

        fn(this.controls);
        this.notify(true);

        return this.isValid(leaveCustom);
    }

    get model() {
        const model = {};

        const fn = (model) => {
            if (!model) return model;

            if (model.key && typeof model.key === "string") {
                return model.value;
            }

            let obj = {};
            for (let prop of Object.getOwnPropertyNames(model))
                obj[prop] = fn(model[prop]);

            return obj;
        }

        for (const prop of Object.getOwnPropertyNames(this.controls))
            model[prop] = fn(this.controls[prop]);

        return model;
    }

    set model(value) {
        const isValueType = model => model.key && typeof model.key === "string";

        const fn = (model, value) => {
            if (!model) return;

            if (isValueType(model)) {
                model.setValue(value);
                return;
            }

            for (let prop of Object.getOwnPropertyNames(model))
                fn(model[prop], value && value[prop]);
        }

        for (const prop of Object.getOwnPropertyNames(this.controls)) {
            fn(this.controls[prop], value && value[prop]);
        }


        this.validate();
    }
}