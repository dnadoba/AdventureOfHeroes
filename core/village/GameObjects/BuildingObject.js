if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'justmath',
'./StaticObject',
], function(Q, events, JustMath, StaticObject){
    var Vec2 = JustMath.Vec2;
    function BuildingObject(VID, data){
        // call super constructor
        StaticObject.call(this, VID, data);
    }
    // inherits from StaticObject
    BuildingObject.prototype = Object.create(StaticObject.prototype);
    
    BuildingObject.prototype.instanceType = 'StaticObject';
    
    BuildingObject.prototype.dbTable = '';
    
    
    return BuildingObject;
});