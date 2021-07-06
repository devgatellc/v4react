import React from 'react';
import FormControl from './formControl';

export default class Radio extends FormControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        
        return <input {...props} type="radio" ref={el => { this.control = el; }} />;
    }
}
