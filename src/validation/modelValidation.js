import { ValidationContext, unique_key, validateValue } from './validation';

export class ValidationArray {
    constructor(structure) {
        if (Array.isArray(structure))
            this.complex = false;
        else
            this.complex = true;

        this.structure = structure;
    }

    *[Symbol.iterator]() {
        if (this.complex) {
            for (const prop in this.structure)
                yield this.structure[prop];
        }
        else {
            for (const prop of this.structure)
                yield prop;
        }
    }
}

class ArrayModel {
    constructor(arrayStruct, context, items = []) {
        this._elements = items.map(x => createArrayElement(x, arrayStruct, context));

        Object.defineProperty(this, "structure", { get: function () { return arrayStruct; } });
        Object.defineProperty(this, "context", { get: function () { return context; } });
    }

    *[Symbol.iterator]() {
        for (const item of this._elements)
            yield item;
    }

    pop() {
        this.context.notify(false);
        return this._elements.pop();
    }
    push(item) {
        this._elements.push(createArrayElement(item, this.structure, this.context));
        this.context.notify(false);
    }
    shift() {
        this.context.notify(false);
        return this._elements.shift();
    }
    unshift(...items) {
        const elements = items.map(x => createArrayElement(x, this.structure, this.context));
        this._elements.unshift(...elements);
        this.context.notify(false);
    }
    splice(start, deleteCount, ...items) {
        const elements = items && items.map(x => createArrayElement(x, this.structure, this.context));
        this._elements.splice(start, deleteCount, ...elements);
        this.context.notify(false);
    }

    set(index, item) {
        this._elements[index] = createArrayElement(item, this.structure, this.context);
        this.context.notify(false);
    }
    init(...items) {
        if (this._elements.length)
            this._elements.splice(0, this._elements.length);

        this.unshift(...items);
    }
    toArray() {
        const fn = (model) => {
            if (!model) return model;

            if (model.key && typeof model.key === "string") {
                return model.value;
            }

            if (model instanceof ArrayModel) {
                return model.toArray();
            }
            else {
                let obj = {};
                for (let prop of Object.getOwnPropertyNames(model))
                    obj[prop] = fn(model[prop]);

                return obj;
            }
        }

        return this._elements.map(x => fn(x)) || [];
    }
}

function createArrayModel(structValue, context, defaultArray) {
    const model = new ArrayModel(structValue, context, defaultArray || []);

    return new Proxy(model, {
        get: function (obj, prop) {
            if (prop === '_elements' || prop === 'structure' || prop === 'context' ||
                prop === 'pop' || prop === 'push' || prop === 'shift' || prop === 'unshift' ||
                prop === 'splice' || prop === 'set' || prop === 'init' || prop === 'toArray') return obj[prop];

            const value = model._elements[prop];
            if (typeof value === "function") return value.bind(obj._elements);

            return value;
        },

        set: function (obj, prop, value) {
            obj.set(prop, value);
            return true;
        },

        deleteProperty(obj, prop) {
            obj.splice(prop, 1);
        }
    });
}

function createArrayElement(item, arrayStruct, context) {
    if (!arrayStruct.complex)
        return createValueModel(arrayStruct.structure, context, item);

    let model = {};
    for (let prop in arrayStruct.structure)
        processStructure(model, prop, arrayStruct.structure[prop], context, item);

    return model;
}

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
    else if (structValue instanceof ValidationArray) type = 'array';

    if (modelValue === undefined) {
        if (type === 'value') modelValue = createValueModel(structValue, context, defaultValue);
        else if (type === 'array') modelValue = createArrayModel(structValue, context, defaultValue);
        else modelValue = {};
    }

    Object.defineProperty(model, prop, {
        get: function () { return modelValue; },
        set: function (val) {
            if (type === 'value') modelValue.value = val;
            else if (type === 'array') modelValue.init(...val);
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

            if (model instanceof ArrayModel) {
                for (let item of model)
                    fn(item);
            }
            else {
                for (let prop of Object.getOwnPropertyNames(model))
                    fn(model[prop]);
            }
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

            if (model instanceof ArrayModel) {
                return model.toArray();
            }
            else {
                let obj = {};
                for (let prop of Object.getOwnPropertyNames(model))
                    obj[prop] = fn(model[prop]);

                return obj;
            }
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

            if (model instanceof ArrayModel) {
                model.init(...(value || []));
            }
            else {
                for (let prop of Object.getOwnPropertyNames(model))
                    fn(model[prop], value && value[prop]);
            }
        }

        for (const prop of Object.getOwnPropertyNames(this.controls)) {
            fn(this.controls[prop], value && value[prop]);
        }


        this.validate();
    }
}