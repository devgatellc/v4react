import React from 'react';
import FormControl from './formControl';

export default class Input extends FormControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        if (!props.type) props.type = "text";

        props.ref = el => { this.control = el; };
        return React.createElement('input', props);
    }
}
