define([
'./GameObject',
], function(GameObject){
    function StaticObject(){
        GameObject.call(this);
    }
    
    StaticObject.prototype = Object.create(GameObject.prototype);
    
    return StaticObject;
});