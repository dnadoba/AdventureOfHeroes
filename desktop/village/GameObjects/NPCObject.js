define([
'./GameObject',
], function(GameObject){
    function NPCObject(){
        GameObject.call(this);
    }
    
    NPCObject.prototype = Object.create(GameObject.prototype);
    
    return NPCObject;
});