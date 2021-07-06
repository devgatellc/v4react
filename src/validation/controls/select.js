import React from 'react';
import FormControl from './formControl';

export default class Select extends FormControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        
        return <select {...props} ref={el => { this.control = el; }} />;
    }
}
