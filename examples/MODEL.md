# Model driven validation

```javascript
import { createValidationContext, ValidationArray } from 'v4react';

export default class ModelValidation extends React.Component {
   constructor(props) {
           super(props);

           //create validation structure
           this.validation = createValidationContext({//default value, validation rules
             val: ['', 'required', {name: 'custom', validator: value=>!value || value[0] === value[0].toUpperCase()}], 
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
           controls.array.map(item=>(
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
dirty | Getter | is control dirty
element | Getter, Setter | reference to the html control. Without this reference validation will not work
ref | Function | set control reference
value | Getter, Setter | get or set control value. Value can be set using directly control property controlName = someValue skipping controlName.value = someValiue
validate | Function | validate control. Options dirty - boolean, sync - boolean
err | Function | has control error. Options rule - string, dirty - boolean, contextDirty - validate when context is derty default true
message | function | get error message. Options rule - string

## ValidationArray
Use ValidationArray class to define array validation.
   * Pass model structure for complex array items
   * Pass rules array for simple arrays
   
Validation array is array like object. Overrides some of array methods
Method | Description
------ | -----------
for-of | default
pop | default
push | default
shift | default
unshift | default
splice | default
set | set item at specific position. Options index - number, item - any
init | reinitialize array. Options ...items
toArray | convert ValidationArray to normal javascript array

