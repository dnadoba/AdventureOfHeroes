if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'justmath',
], function(Q, events, JustMath){
    function GameObjectList(){
        // call super constructor
        events.EventEmitter.call(this);
        
        this.chilldren = [];
        this.VIDMap = {};
    }
    // inherits from events.EventEmitter
    GameObjectList.prototype = Object.create(events.EventEmitter.prototype);
    
    GameObjectList.prototype.add = function(gameObject){
        this.chilldren.push(gameObject);
        this.VIDMap[gameObject.VID] = gameObject;
        this.emit('added', gameObject);
    };
    
    GameObjectList.prototype.remove = function(gameObject){
        var index = this.chilldren.indexOf(gameObject);
        if(index === -1){
            return false;
        }else{
            this.chilldren.splice(index, 1);
            delete this.VIDMap[gameObject.VID];
            this.emit('removed', gameObject);
            return true;
        }
    };
    
    GameObjectList.prototype.getByVID = function(VID){
        return this.VIDMap[VID] || false;
    };
    
    GameObjectList.prototype.getByID = function(ID){
        var object;
        this.every(function(gameObejct){
            if(gameObejct.id === ID){
                object = gameObejct;
                return false;
            }else{
                return true;
            }
        }, this);
        return object || false;
    }
    
    GameObjectList.prototype.forEach = function(callback, context){
        return this.chilldren.forEach(callback, context);
    };
    
    GameObjectList.prototype.every = function(callback, context){
        return this.chilldren.every(callback, context);
    };
    
    GameObjectList.prototype.saveData = function(mysqlPool){
        var promiseList = [];
        this.forEach(function(gameObject){
            var promise = gameObject.saveData(mysqlPool);
            promiseList.push(promise);
        }, this);
        return Q.all(promiseList);
    };
    
    return GameObjectList;
});