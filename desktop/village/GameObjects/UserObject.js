define([
'./DynamicObject',
'three',
'desktop/utili/debug',
], function(DynamicObject, THREE, debug){
    function UserObject(){
        DynamicObject.call(this);
    }
    
    UserObject.prototype = Object.create(DynamicObject.prototype);
    
    return UserObject;
});