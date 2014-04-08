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
    function StaticObject(VID, data){
        // call super constructor
        GameObject.call(this, VID, data);
    }
    // inherits from GameObject
    StaticObject.prototype = Object.create(GameObject.prototype);
    
    StaticObject.prototype.instanceType = 'StaticObject';
    
    StaticObject.prototype.dbTable = '';
    
    
    return StaticObject;
});