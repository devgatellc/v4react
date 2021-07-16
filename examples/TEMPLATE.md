# Template driven validation

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