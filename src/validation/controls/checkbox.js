import React from 'react';
import FormControl from './formControl';

export default class CheckBox extends FormControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        
        return <input {...props} type="checkbox" ref={el => { this.control = el; }} />;
    }
}
