import React from 'react';

import { validateValue, unique_key } from '../validation';

export default class FormControl extends React.Component {
    constructor(props) {
        super(props);
    }

    rulePassed(name, rules) {
        rules = rules || [];
        return !!rules.find(x => x && (x == name || x.name == name))
    }

    getRules(props) {
        let rules = [...(props.rules || [])];

        if (props.required && !this.rulePassed('required', rules)) rules.push('required');
        if (props.requireChecked && !this.rulePassed('requireChecked', rules)) rules.push('requireChecked');

        if (props.type == "email" && !this.rulePassed('email', rules)) rules.push('email');
        if (props.type == "url" && !this.rulePassed('url', rules)) rules.push('url');
        if (props.type == "number" && !this.rulePassed('number', rules)) rules.push('number');

        if (props.min !== undefined && props.min !== null && !this.rulePassed('min', rules)) rules.push({ name: 'min', value: props.min });
        if (props.max !== undefined && props.max !== null && !this.rulePassed('max', rules)) rules.push({ name: 'max', value: props.max });
        if (props.minLength !== undefined && props.minLength !== null && !this.rulePassed('minLength', rules)) rules.push({ name: 'minLength', value: props.minLength });
        if (props.maxLength !== undefined && props.maxLength !== null && !this.rulePassed('maxLength', rules)) rules.push({ name: 'maxLength', value: props.maxLength });
        if (props.pattern && !this.rulePassed('pattern', rules)) rules.push({ name: 'pattern', value: props.pattern });

        return rules;
    }

    //check if rules has changed based on name, key or value
    hasRulesChanged(prevRules, nextRules) {
        if (prevRules.length != nextRules.length) return true;

        for (let i = 0; i < prevRules.length; i++) {
            if (typeof prevRules[i] == "string" || typeof nextRules[i] == "string") {
                if (prevRules[i] !== nextRules[i]) return true;
            }
            else {
                if (prevRules[i].name !== nextRules[i].name || prevRules[i].key !== nextRules[i].key) return true;

                let prevValue = typeof prevRules[i].value == "function" ? prevRules[i].value() : prevRules[i].value;
                let nextValue = typeof nextRules[i].value == "function" ? nextRules[i].value() : nextRules[i].value;

                if (prevValue !== nextValue) return true;
            }
        }

        return false;
    }

    //check for errors
    getSnapshotBeforeUpdate(prevProps) {
        const prevRules = this.getRules(prevProps);
        const rules = this.getRules(this.props);

        const hasRulesChanged = this.hasRulesChanged(prevRules, rules);
        if (!hasRulesChanged && this.props.value === prevProps.value) return null;

        this._errors = validateValue(this.props.value, rules);
        return { empty: !this._errors, hasRulesChanged, errors: this._errors };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!this.props.validation || !snapshot) return;
        if (prevProps.name !== this.props.name) throw new Error("name attribute change is not allowed");

        this.props.validation.addResult({
            key: this._keyName,
            errors: snapshot.errors
        });
    }

    componentDidMount() {
        this._keyName = this.props.name || unique_key();
        if (!this.props.validation) return;

        this._errors = validateValue(this.props.value, this.getRules(this.props))
        this.props.validation.addResult({
            key: this._keyName,
            errors: this._errors
        });

        if (this._errors) this.forceUpdate();
        this.subscription = this.props.validation.on(this._keyName).subscribe(() => {
            if (this._componentUnmounted) return;
            this.forceUpdate();
        });
    }

    //removes binding from validation context
    componentWillUnmount() {
        this._componentUnmounted = true;

        if (this.subscription)
            this.subscription.unsubscribe();

        if (this.props.validation)
            this.props.validation.removeResult(this._keyName);
    }

    getRenderProps() {
        let { validation, rules, errorClass, ...props } = this.props;
        if (errorClass === undefined) errorClass = 'is-invalid';

        if (validation && errorClass && this._errors && validation.dirty) props.className = `${props.className || ''} ${errorClass}`;

        return props;
    }
}
