import React from 'react';
import FormControl from './formControl';

export default class Select extends FormControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        
        props.ref = el => { this.control = el; };
        return React.createElement('select', props);
    }
}
