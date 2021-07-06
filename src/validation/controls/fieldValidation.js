import React from 'react';

//shows field validation errors
export default class FieldValidation extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        if (!this.props.validation || !this.props.name) return;

        this.subscription = this.props.validation.on(this.props.name).subscribe(() => {
            if (this._componentUnmounted) return;
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this._componentUnmounted = true;

        if (this.subscription)
            this.subscription.unsubscribe();
    }

    render() {
        let { validation, always, rule, rules, dirty, children, ...rest } = this.props;
        if (!this.props.name || !validation || (!always && !validation.dirty)) return null;

        let hasError = false;
        if (rule || !rules) {
            hasError = validation.hasError(this.props.name, rule, dirty);
        }
        else if (rules && rules.length) {
            for (let ruleName of rules) {
                rule = ruleName;
                hasError = validation.hasError(this.props.name, rule, dirty);

                if (hasError) break;
            }
        }
        if (!hasError) return null;

        let message = (children && React.Children.count(children) > 0) ? children : null;

        if (!message) {
            let state = validation.getState(this.props.name);
            if (state.errors) {
                if (rule && state.errors[rule]) {
                    message = state.errors[rule].message || '';
                }
                else if (rules && rules.length) {
                    for (let ruleName of rules) {
                        if (state.errors[ruleName]) {
                            message = state.errors[ruleName].message || '';
                            break;
                        }
                    }
                }

                if (!message) {
                    for (let ruleName in state.errors) {
                        message = state.errors[ruleName].message || '';
                        break;
                    }
                }
            }
        }
        if (typeof message == "function") message = message();

        return (
            <div {...rest}>
                {message}
            </div>
        );
    }
}