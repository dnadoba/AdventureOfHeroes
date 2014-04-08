define([
'./StaticObject',
], function(StaticObject){
    function BuildingObject(){
        StaticObject.call(this);
    }
    
    BuildingObject.prototype = Object.create(StaticObject.prototype);
    
    return BuildingObject;
});