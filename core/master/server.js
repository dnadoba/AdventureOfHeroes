if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'general/promise.io/server',
'core/master/slave',
'events'
], 
function(Q, PromiseServer, Slave, events){
    
    function MasterServer(portForSlaves, portForCluster, host, authKey, debug){
        this.slaveMasterServer = new PromiseServer();
        this.slaveMasterServer.authKey = authKey;
        this.slaveMasterServer.sendErrorMessage = debug;
        this.slaveMasterServer.listen(portForSlaves, host);
        
        this.clusterMasterServer = new PromiseServer();
        this.clusterMasterServer.setAuthKey(authKey);
        this.clusterMasterServer.sendErrorMessage = debug;
        this.clusterMasterServer.listen(portForCluster, host);
        
        this.slaves = [];
        this.villages = {};
        this.users = {};
        
        this.slaveMasterServer.on('connection', this.onSlaveConnection.bind(this));
        
        this.setClusterEventListener();
        
    }
    
    /**
     * adds automatically event listerns to events to a function that begins with onGet_ or onPost_
     */
    
    MasterServer.prototype.setClusterEventListener = function(){
        this._addEventListeners('onGet_', (function(funcName, eventName){
            this.clusterMasterServer.onGet(eventName, this[funcName].bind(this));
        }).bind(this));
        this._addEventListeners('onPost_', (function(funcName, eventName){
            this.clusterMasterServer.onPost(eventName, this[funcName].bind(this));
        }).bind(this));
        
    };
    
    MasterServer.prototype._addEventListeners = function(keyWord, addEvent){
        var allKeys = Object.keys(MasterServer.prototype);
        var keys = allKeys.filter(function(key){
            return key.indexOf(keyWord) === 0;
        });
        for(var i = 0; i < keys.length; i++){
            var funcName = keys[i];
            var eventName = funcName.replace(keyWord, '');
            addEvent(funcName, eventName);
        }
    };
    
    /*
    MasterServer.prototype.onGet_existsUser = function(userId){
        return Q.Promise((function(resolve, reject){
            var user = this.users[userId];
            if(user !== undefined){
                resolve();
            }else{
                reject();
            }
        }).bind(this));
    };
    */
    MasterServer.prototype.onGet_villageUserList = function(villageId){
        return Q.Promise((function(resolve, reject){
            var village = this.villages[villageId];
            if(village !== undefined){
                var userList = village.getUserList();
                resolve(userList);
            }else{
                resolve([]);
            }
        }).bind(this));
    };
    
    MasterServer.prototype.onGet_userJoinVillage = function(data){
        var userId = data.userId;
        var villageId = data.villageId;

        var user = this.users[userId];
        if(user !== undefined){
            user.disconect();
            user.remove();
        }
        var village = this.villages[villageId];
        
        return Q.when(village || this.createVillage(villageId))
        .then((function(village){
            return this.createUser(village, userId)
            
            .then(function(){
                var hostInfo = {
                    address : village.address,
                    port : village.port,
                };
                console.log("hostInfo:", hostInfo);
                return hostInfo;
            });
            
        }).bind(this))
            

    };
    
    MasterServer.prototype.createVillage = function(villageId){
        return Q.Promise((function(resolve, reject){
            var slave = this.getLeastLoadedSlave();
            if(slave === false){
                reject('NO FREE SLAVE');
                return;
            }
            slave.createVillage(villageId)
            .then((function(village){
                this.villages[village.id] = village;
                village.on('removed', (function(){
                    delete this.villages[village.id];
                }).bind(this));
                return village;
            }).bind(this))
            .then(resolve, reject);
        }).bind(this));
    };
    
    MasterServer.prototype.createUser = function(village, userId){
        return village.createUser(userId)
        .then((function(user){
            this.users[user.id] = user;
            user.on('removed', (function(){
                console.log("user removed", user.id);
                delete this.users[user.id];
            }).bind(this));
            
        }).bind(this));
    };
    
    MasterServer.prototype.onSlaveConnection = function(promiseSocket){
        console.log("new slave connected from " + promiseSocket.socket.remoteAddress + ':' + promiseSocket.socket.remotePort);
        var slave = new Slave(promiseSocket);
        this.slaves.push(slave);
        slave.on('end', (function(){
            var index = this.slaves.indexOf(slave);
            console.log("Slave disconnect");
            if(index !== -1){
                this.slaves.splice(index, 1);
            }
        }).bind(this));
    };
    
    MasterServer.prototype.setWhiteList = function(){
        this.slaveMasterServer.setWhiteList.apply(this.slaveMasterServer, arguments);
        this.clusterMasterServer.setWhiteList.apply(this.clusterMasterServer, arguments);
    };
    
    
    MasterServer.prototype.getLeastLoadedSlave = function(){
        var freePlaces = 0;
        var atLeastLoadedSlave;
        for(var i = 0; i < this.slaves.length; i++){
            var slave = this.slaves[i];
            var slaveFreePlaces = slave.getFreePlaces();
            if(slaveFreePlaces > freePlaces){
                freePlaces = slaveFreePlaces;
                atLeastLoadedSlave = slave;
            }
        }
        if(atLeastLoadedSlave === undefined){
            return false;
        }else{
            return atLeastLoadedSlave;
        }
    };
    
    return MasterServer;
});