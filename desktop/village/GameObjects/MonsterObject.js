define([
'./DynamicObject',
'three',
'desktop/utili/debug',
], function(DynamicObject, THREE, debug){
    function MonsterObject(){
        DynamicObject.call(this);
    }
    
    MonsterObject.prototype = Object.create(DynamicObject.prototype);
    
    return MonsterObject;
});