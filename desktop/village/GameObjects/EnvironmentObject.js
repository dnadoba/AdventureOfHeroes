define([
'./StaticObject',
], function(StaticObject){
    function EnvironmentObject(){
        StaticObject.call(this);
    }
    
    EnvironmentObject.prototype = Object.create(StaticObject.prototype);
    
    return EnvironmentObject;
});