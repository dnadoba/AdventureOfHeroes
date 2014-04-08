if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'justmath',
'./NPCObject',
], function(Q, events, JustMath, NPCObject){
    var Vec2 = JustMath.Vec2;
    function VillagerObject(VID, data){
        // call super constructor
        NPCObject.call(this, VID, data);
    }
    // inherits from NPCObject
    VillagerObject.prototype = Object.create(NPCObject.prototype);
    
    VillagerObject.prototype.instanceType = 'NPCObject';
    
    VillagerObject.prototype.dbTable = '';
    
    
    return VillagerObject;
});