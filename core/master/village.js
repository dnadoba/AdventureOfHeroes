if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'core/master/user',
'events'
], 
function(Q, User, events){
    function Village(villageId, socket, address, port){
        //call super constructor
        events.EventEmitter.call(this);
        this.id = villageId;
        this.address = address;
        this.port = port;
        this.socket = socket;
        
        this.users = {};
        
        this.crtUserCount = 0;
        
    }
    
    // inherits from events.EventEmitter
    Village.prototype = Object.create(events.EventEmitter.prototype);
    
    Village.prototype.createUser = function(userId){
        return Q.Promise((function(resolve, reject){
            this.socket.get('village::createUser', {
                villageId : this.id,
                userId : userId,
            })
            .then((function(){
                var user = new User(userId, this.id, this.socket);
                this.users[userId] = user;
                
                user.on('removed', (function(){
                    this.crtUserCount--;
                    this.emit('userRemoved');
                    
                    delete this.users[userId];
                }).bind(this));
                
                this.crtUserCount++;
                
                this.emit('userCreated');
                
                resolve(user);
            }).bind(this))
            .catch(reject);
        }).bind(this));
    };
    
    Village.prototype.onPost_userDisconnect = function(userId){
        var user = this.users[userId];
        if(user !== undefined){
            user.remove();
        }
    }
    
    Village.prototype.getUserList = function(){
        return Object.keys(this.users)
    }
    
    Village.prototype.remove = function(){
        for(var userId in this.users){
            var user = this.users[userId];
            user.remove();
        }
        this.emit('removed');
        this.removeAllListeners();
    };
    return Village;
});