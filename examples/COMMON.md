# General Usage

## ValidationContext

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
controls | Field | model driven validation structure controls | ref - bind to html element, value - control value, dirty - is control dirty, err - has control error, message - get validation message, validate - validate specific control in case there is dependency on other control
model | Field | model driven validation model | gets or sets validation model object
validate | Function | validate whole model in model driven validation | leaveCustom - boolean don't remove custom errors
