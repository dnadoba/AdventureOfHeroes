if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'justmath',
'./DynamicObject',
], function(Q, events, JustMath, DynamicObject){
    var Vec2 = JustMath.Vec2;
    function MonsterObject(VID, data, socket){
        // call super constructor
        DynamicObject.call(this, VID, data);
        
    }
    // inherits from DynamicObject
    MonsterObject.prototype = Object.create(DynamicObject.prototype);
    
    MonsterObject.prototype.instanceType = 'MonsterObject';
    
    MonsterObject.prototype.dbTable = '';
    
    MonsterObject.prototype.keysToSave = [];
    
    return MonsterObject;
});