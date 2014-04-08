if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'justmath',
'./GameObject',
], function(Q, events, JustMath, GameObject){
    var Vec2 = JustMath.Vec2;
    function NPCObject(VID, data){
        // call super constructor
        GameObject.call(this, VID, data);
    }
    // inherits from GameObject
    NPCObject.prototype = Object.create(GameObject.prototype);
    
    NPCObject.prototype.instanceType = 'NPCObject';
    
    NPCObject.prototype.dbTable = '';
    
    
    return NPCObject;
});