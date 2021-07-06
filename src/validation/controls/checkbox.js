import React from 'react';
import FormControl from './formControl';

export default class CheckBox extends FormControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        props.type = "checkbox";
        
        props.ref = el => { this.control = el; };
        return React.createElement('input', props);
    }
}
