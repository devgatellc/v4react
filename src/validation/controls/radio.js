import React from 'react';
import FormControl from './formControl';

export default class Radio extends FormControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        props.type = "radio";
        
        props.ref = el => { this.control = el; };
        return React.createElement('input', props);
    }
}
