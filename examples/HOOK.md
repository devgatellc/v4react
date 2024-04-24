# Hook validation

```javascript
import { useValidationContext, useValidation } from 'v4react';

export default function HookValidation() {
    //create context
    let context = useValidationContext();

    //create validation value.
    let [val, setVal, valCtr] = 
       useValidation('', ['required', {name: 'custom', validator: value=>!value || value[0] === value[0].toUpperCase()}], context);
             
    const submit = () =>{
      context.setDirty();
      console.log(context.isValid());
    }
    
    return <React.Fragment>
         <div>
            <input type="text" className={valCtr.err()? 'is-invalid' : ''}
                    value={val}  onChange={e => { setVal(e.target.value); }} />
            {valCtr.err('required') && <div>value is required!</div>}
            {valCtr.err('custom') && <div>value is invalid!</div>}
         </div>
         
         <div>
           <button onClick={submit}>Submit</button>
         </div>
       </React.Fragment>
}
```