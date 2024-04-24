# Model driven validation

```javascript
import { createValidationContext } from 'v4react';

export default class ModelValidation extends React.Component {
   constructor(props) {
           super(props);

           //create validation structure
           this.validation = createValidationContext({//default value, validation rules
             val: ['', 'required', {name: 'custom', validator: value=>!value || value[0] === value[0].toUpperCase()}], 
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
         
         <div>
           <button onClick={this.submit}>Submit</button>
         </div>
       </React.Fragment>
     }
}
```



## createValidationContext(model: any, props?: {update: { forceUpdate() } | function})
Helper function to create model validation context
  * Define structure of validation model and assign array. First argument is default value, rest validation rules
  * use props object to subscribe on validation updates easily. Same as context.on()

## Validation Controls
After create context from model structure validation controls are defined in context.controls property. 

Property | Type | Description
-------- | ---- | -----------
key | Getter | unique key of the control
rules | Getter | rules defined in validation structure
element | Getter, Setter | reference to the html control. Without this reference validation will not work
ref | Function | set control reference
value | Getter, Setter | get or set control value. Value can be set using directly control property controlName = someValue skipping controlName.value = someValiue
validate | Function | validate control. Options sync - boolean
err | Function | has control error. Options rule - string, dirty - validate when context is derty default true
message | function | get error message. Options rule - string

