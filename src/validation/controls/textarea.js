import React from 'react';
import FormControl from './formControl';

export default class TextArea extends FormControl {
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        super.componentDidUpdate(prevProps, prevState, snapshot);
        if (prevProps.value != this.props.value && this.props.autoHeight) {
            this.control.style.height = 0;
            this.control.style.height = this.control.scrollHeight + 'px';
        }
    }

    componentDidMount(){
        super.componentDidMount();
        if (this.props.value && this.props.autoHeight) {
            this.control.style.height = 0;
            this.control.style.height = this.control.scrollHeight + 'px';
        }
    }

    render() {
        let renderProps = this.getRenderProps();
        let { autoHeight, ...props } = renderProps;

        return <textarea {...props} ref={el => { this.control = el; }} />
    }
}
