if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'core/master/village',
'events'
], 
function(Q, Village, events){
    function Slave(socket){
        //call super constructor
        events.EventEmitter.call(this);
        
        this.socket = socket;
        this.socket.on('end', this.onend.bind(this));
        this.maxUserCount = 0;
        this.crtUserCount = 0;
        
        this.established = Q.Promise((function(resolve, reject){
            this.socket.get('maxUserCount')
            .then(this.onGetMaxUserCount.bind(this))
            .then((function(){
                return this.socket.get('addressAndPort')
                .then(this.onGetAddressAndPort.bind(this));
            }).bind(this))
            .then(this.addEventListeners.bind(this))
            .then(resolve)
            .catch(reject);
        }).bind(this));
        
        
        
        this.address = '';
        this.port = 0;
        
        
        
        this.established.then((function(){
            console.log("Slave established URL:", this.address + ':' + this.port);
        }).bind(this))
        
        
        
        this.villages = {};
    }
    // inherits from events.EventEmitter
    Slave.prototype = Object.create(events.EventEmitter.prototype);
    
    /**
     * this functions will only executed once to add all importent listerns to the socket
     */
    Slave.prototype.addEventListeners = function(){
        this.socket.onPost('village::userDisconnect', this.onVillage_userDisconnect.bind(this));
    };
    
    /**
     * this function will be executed then a user disconects from the slave
     * @param {Number} villageId
     * @param {Number} userId
     */
    
    Slave.prototype.onVillage_userDisconnect = function(villageId, userId){
        var village = this.villages[villageId];
        if(village !== undefined){
            village.onPost_userDisconnect(userId);
        }
    };
    
    /**
     * creates a village on this slave by the given id
     * @params {Number} villageId
     * @returns {Promise} promise
     */
    Slave.prototype.createVillage = function(villageId){
        return Q.Promise((function(resolve, reject){
            this.socket.get('createVillage', villageId)
            .then((function(){
                
                var village = new Village(villageId, this.socket, this.address, this.port);
                this.villages[villageId] = village;
                
                village.on('userCreated', (function(userId){
                    this.crtUserCount++;
                }).bind(this));
                village.on('userRemoved', (function(userId){
                    this.crtUserCount--;
                }).bind(this))
                village.on('removed', (function(){
                    delete this.villages[villageId];
                }).bind(this));
                
                resolve(village);
                
            }).bind(this))
            .catch(reject);
        }).bind(this));
    };
    
    /**
     * this function will be executed when the socket connection ends
     */
    Slave.prototype.onend = function(){
        for(var villageId in this.villages){
            var village = this.villages[villageId];
            village.remove();
        }
        this.villages = {};
        this.emit('end');
        this.removeAllListeners();
    };
    
    /**
     * this function will be executed when we get the max user count from this slave
     * @param {Numer} maxUserCount
     */
    Slave.prototype.onGetMaxUserCount = function(maxUserCount){
        this.maxUserCount = maxUserCount;
    };
    
    /**
     * this function will be execurtet when we get the real address from the slave
     * @param {String} address - IP or domain with a port
     */
    Slave.prototype.onGetAddressAndPort = function(data){
        this.address = data.address;
        this.port = data.port;
    };
    /**
     * get the current free user places
     */
    Slave.prototype.getFreePlaces = function(){
        return this.maxUserCount - this.crtUserCount;
    };
    
    return Slave;
});