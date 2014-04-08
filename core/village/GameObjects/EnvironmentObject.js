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
    function EnvironmentObject(VID, data){
        // call super constructor
        StaticObject.call(this, VID, data);
    }
    // inherits from StaticObject
    EnvironmentObject.prototype = Object.create(StaticObject.prototype);
    
    EnvironmentObject.prototype.instanceType = 'EnvironmentObject';
    
    EnvironmentObject.prototype.dbTable = 'villageEnironment';
    
    
    return EnvironmentObject;
});