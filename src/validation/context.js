import { ValidationContext, validationConfig, validateValue } from './validation';
import { ModelValidationContext, ValidationArray } from './modelValidation';

export function createValidationContext(model, props) {
    let context;
    if (!model) context = new ValidationContext();
    else context = new ModelValidationContext(model)

    props = props || {};

    if (props.update) {
        let fn = props.update;
        if (typeof fn != "function") fn = () => { props.update.forceUpdate(); }

        let subscription = context.on().subscribe(fn);
        if (props.getSubscription) props.getSubscription('Update', subscription);
    }

    return context;
}

export { ValidationContext, validationConfig, validateValue, ModelValidationContext, ValidationArray };