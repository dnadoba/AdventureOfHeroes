if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events'
], function(Q, events){
    function User(userId, villageId, socket){
        //call super constructor
        events.EventEmitter.call(this);
        this.id = userId;
        this.villageId = villageId;
        this.socket = socket;
    }
    
    // inherits from events.EventEmitter
    User.prototype = Object.create(events.EventEmitter.prototype);
    
    User.prototype.disconect = function(){
        this.socket.post('village::disconectUser', {
            villageId : this.villageId,
            userId : this.id,
        });
    }
    
    User.prototype.remove = function(){
        this.emit('removed');
        this.removeAllListeners();
    }
    
    return User;
});