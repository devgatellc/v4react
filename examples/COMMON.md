# Common Functionality

## createValidationContext 
Main component which accomulates validation results and provides common functionality

Property | Type | Description | Options
-------- | ---- | ----------- | -------
dirty | Field | Is context dirty or pristine
setDirty | Function | Set Context dirty | sync - boolean
setPristine | Function | Set context pristine | sync - boolean
addResult | Function | Add validation result | result - {key: string, custom: boolean, errors: [{name: string, message: string \| function}]}, sync - boolean
removeResult | Function | Remove result | key - validation result key, sync - boolean
getState | Function | Get state of specific result | key - string. returns {valid: boolean, errors: {[prop: string]: boolean}}
getMessage | Function | Get message of specific result | key - string, optional rule - string
hasError | Function | Get if specific result has error | key - string, optional rule - string
isValid | Function | Is context valid
on | Function | subscribe to context to get notifications | keys - string \| string[], returns { subscribe(function): {unsubscribe()} }
notify | Function | notify context on specific key. Notifications can be either sync or async | sync - boolean default false, key - string. if not passed each subscription is notified


## validatateValue(value, rules)
Main function which validates control value using rules array. returns {name: string, message: string | function} or null

#### Rules array can be string or object
Propery | Type | Description
------- | ---- | -----------
name | string - required | identifier of rule
message | string \| function - optional | message if rule is not valid
validator | function - optional | rule validation function(value: any, ruleValue?: any). If not present global validate functions are used matching the rule name
value | any - optional | if present passed to validator as the second parameter
convert | function \| {[prop: string]: boolean \| function} - optional | convert value before validation. If present and not function use global converts


## validationConfig 
Global validation settings

Property | Description | Defaults
-------- | ----------- | --------
validators | gets or sets global validator | required, requiredIf(value, ifCase: boolean), requireChecked, email, url, min(value, min), max(value, max), minLength(value, length), maxLength(value, length), equals(value, equalValue), number, integer, pattern(value, pattern)
converts | gets or sets global converts | trim, upper, lower
notifyTime | gets or sets time for validation context to notify async changes | 10ms
