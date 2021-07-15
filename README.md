# v4react
Reactjs validation for both - class and hook components. In case of class components it can be used with two approaches:
  * Template driven approach - uses custom components. Adding and managing new validation components are easily handled.
  * Model driven approach - Validation model structure is being defined and used with plain html components.

Hook components approach defines validation methods which are easily used with react hooks.

# Installation
`npm i v4react --save`

# Examples of usage
## Template driven validation
```javascript
//import validation components
import { createValidationContext, Input, CheckBox, Select, FieldValidation } from 'v4react';

export default class TemplateValidation extends React.Component {
   constructor(props) {
           super(props);

           this.state = {
             value: ''
           };

           //create validation context
           this.validation = createValidationContext();
       }
       
       submit = () =>{
         this.validation.setDirty();
         console.log(this.validation.isValid());
       }
       
     render(){
       //use v4react controls for validation. all html validation attributes supported. 
       //define custom validation attributes in rules prop. 
       //example: validate input on required and first letter to be uppercase
       return <React.Fragment>
         <div>
            <Input type="text" name="control_name" value={this.state.value} 
                   onChange={e => { this.setState({ value: e.target.value }); }} validation={this.validation}
                   rules={[{ name: "custom", validator: value => !value || value[0] === value[0].toUpperCase() }]}
                   required />
            <FieldValidation name="control_name" rule="required" validation={this.validation}>
               value is required!
            </FieldValidation>
            <FieldValidation name="control_name" rule="custom" validation={this.validation}>
               value is invalid
            </FieldValidation>
         </div>
         <div>
           <button onClick={this.submit}>Submit</button>
         </div>
       </React.Fragment>
     }
}
```

## Model driven validation
```javascript
import { createValidationContext, ValidationArray } from 'v4react';

export default class ModelValidation extends React.Component {
   constructor(props) {
           super(props);

           //create validation structure
           this.validation = createValidationContext({
             val: ['', 'required', {name: 'custom', validator: value=>!value || value[0] === value[0].toUpperCase()], //default value, validation rules
             array: new ValidationArray({
                id: [''],
                val: ['', 'required']
             })
           }, { update: this });
       }
       
       submit = () =>{
         this.validation.setDirty();
         console.log(`model = ${JSON.stringify(this.validation.model)}, isValid = ${this.validation.isValid()}`);
       }
       
     render(){
       //use v4react model validation controls to validate plain html components.
       //example: validate input on required and first letter to be uppercase.
       const controls = this.validation.controls;
       return <React.Fragment>
         <div>
            <input type="text" ref={controls.val.ref} className={controls.val.err()? 'is-invalid' : ''}
                    value={controls.val.value}  onChange={e => { controls.val = e.target.value; }} />
            {controls.val.err('required') && <div>value is required!</div>}
            {controls.val.err('custom') && <div>value is invalid!</div>}
         </div>
         
         {
           controls.arr.map(item=>(
            <div key={item.id.val}>
               <input type="text" ref={item.val.ref} className={item.val.err()? 'is-invalid' : ''}
                      value={item.val.value}  onChange={e => { item.val = e.target.value; }} />
              {item.val.err() && <div>value is required!</div>}
            </div>
           ))
         }
         
         <div>
           <button onClick={this.submit}>Submit</button>
         </div>
       </React.Fragment>
     }
}
```

# ValidationContext
Property | Type | Description | Options
-------- | ---- | ----------- | -------
dirty | Field | Is context dirty or pristine
setDirty | Function | Set Context dirty | leavCustomErrors - removes custom errors if false. Default false 
setPristine | Function | Set context pristine | leavCustomErrors - removes custom errors if false. Default false 
addResult | Function | Add validation result | result - {key: string, dirty: boolean, custom: boolean, errors: [{name: string, message: string}]}
removeResult | Function | Remove result | key - validation result key
addError | Function | Add custom error | error - string or {key: string, message: string}
removeError | Function | Remove custom error | key - custom error key
removeCustomErrors | Function | Remove all custom errors
getState | Function | Get state of specific result | key - string. returns {valid: boolean, dirty: boolean, errors: {[prop: string]: boolean}}
getMessage | Function | Get message of specific result | key - string, optional rule - string
hasError | Function | Get if specific result has error | key - string, optional rule - string, optional dirty - boolean
isValid | Function | Is context valid | skipCustom - boolean skip custom error validation
