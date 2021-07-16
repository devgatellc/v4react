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