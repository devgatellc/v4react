# v4react
Reactjs validation - using validation hooks it's possible to easily validate controls without even using a form tag.

## Installation
`npm i v4react --save`

## useValidationContext(): ValidationContext
Create validation context which stores validation state and can be used as a source of truth.

### ValidationContext
Property | Type | Description | Options | Return
-------- | ---- | ----------- | ------- | ------
key | string | Context is immutable. Key is updated after every control validation so it can be used to update memoized child components
dirty | boolean | Is context dirty or pristine
setDirty | Function | Set context dirty | | boolean
setPristine | Function | Set context pristine | | boolean
addResult | Function | Add validation result | key: string,  results: [{name: string, message: string}]
removeResult | Function | Remove result | key: string - validation result key
getState | Function | Get state of specific result | key: string | {valid: boolean, errors: {[prop: string]: { message: string }}}
getMessage | Function | Get message of the specific result | key: string, rule?: string | string
hasError | Function | Get if specific result has error | key: string, rule? string | boolean
isValid | Function | Is context valid | | boolean
on | Function | subscribe to context to get notifications | key: string | { subscribe(function): {unsubscribe()} }
notify | Function | notify context on specific key | key: string. If not passed each subscription is notified

## useValidation\<S\>(defaultValue: S | (() => S), rules: Rule[], context: ValidationContext, deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)): [S, (val: S | ((prevState: S) => S)) => void, ValidationControl\<S\>, ()=> void];
Similar hook like useState but validation rules are added.

### Rule = string | { name: string; value?: any; message?: string; validator?: (value: any, ruleValue?: any, deps?: any[]) => boolean; convert?: Convert }
### Convert = string | ((value: any, ruleValue?: any, deps?: any[]) => any) | { [prop: string]: string | ((value: any, ruleValue?: any, deps?: any[]) => any) }
### enabled - use this if validation depends on some logic. For example controle might not be visible on the form and it should not be validated. If deps are not needed this can be passed instead of it.

### ValidationControl
Property | Type | Description | Options | Return
-------- | ---- | ----------- | ------- | ------
key | string | Unique key identifying this control
value | any | Control value. Same as the first parameter of the useValidation hook
dirty | boolean | Is control dirty or pristine
setDirty | Function | Set control dirty | | boolean
setPristine | Function | Set control pristine | | boolean
err | Function | If control has error | rule?: string | boolean
derr | Function | If control has error depending on the dirty state | rule?: string, state?: boolean. If state undefined - validates when context is dirty. If false - when control is dirty. If true - when either context or control is dirty. Can be passed instead of rule | boolean
message | Function | Return message of the specific result | rule?: string | string

### Last parameter returned from useValidation hook can be used as control's onBlur event. It'll set control as dirty

## useValidationValue\<S\>(defaultValue: S | (() => S)): { value: S }
Sometimes multiple validations depend on each other. With useValidationValue values can be created before passing them to useValidation hook.

## ValidationProvider
ValidationProvider element can be used to pass context to child elements using hooks.

### usePValidationContext()
Get validation context in ```javascript<ValidationProvider></ValidationProvider>``` child components.

### usePValidation\<S\>(defaultValue: S | (() => S), rules: Rule[], deps?: any[] | boolean | ((val: S) => boolean), enabled?: boolean | ((val: S) => boolean)): [S, (val: S | ((prevState: S) => S)) => void, ValidationControl\<S\>, ()=> void];
Similar to useValidation but context is passed from ValidationProvider parent component.

## validationConfig 
Global validation settings

Property | Description | Defaults
-------- | ----------- | --------
validators | gets or sets global validator | required, requiredIf(value, ifCase: boolean), requireChecked, email, url, min(value, min), max(value, max), minLength(value, length), maxLength(value, length), equals(value, equalValue), number, integer, pattern(value, pattern)
converts | gets or sets global converts | trim, upper, lower

## Example

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
            <input type="text" className={valCtr.derr()? 'is-invalid' : ''} value={val}  onChange={e => { setVal(e.target.value); }} />
            {valCtr.derr('required') && <div>value is required!</div>}
            {valCtr.derr('custom') && <div>value is invalid!</div>}
         </div>
         
         <div>
           <button onClick={submit}>Submit</button>
         </div>
       </React.Fragment>
}
```