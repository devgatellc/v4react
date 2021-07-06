import React from 'react';
import FormControl from './formControl';

export default class TextArea extends FormControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        
        props.ref = el => { this.control = el; };
        return React.createElement('textarea', props);
    }
}
