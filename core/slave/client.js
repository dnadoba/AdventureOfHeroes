if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'general/promise.io/client',
'events',
'core/village/village',
'socket.io',
'core/slave/mysqlPool',
'general/user/login',
'performance-now',
], 
function(Q, PromiseClient, events, Village, socketIO, mysqlPool, Login, now){
    function SlaveClient(masterPort, host, authKey, address, port){
        this.socket = new PromiseClient(masterPort, host, authKey);
        this.socket.on('connected', this.onconnected.bind(this));
        this.socket.on('disconnect', this.ondisconnect.bind(this));
        
        this.login = new Login(mysqlPool);
        
        this.io = socketIO.listen(port);
        this.io.set('authorization', (function(handshakeData, callback){
            var sessionHash = handshakeData.query.hash;
            this.login.bySession(sessionHash)
            .then((function(userData){
                var userId = userData.id;
                var villageId = handshakeData.query.villageId;
                var village = this.villages[villageId];
                if(village === undefined || village.awaitUsers[userId] === undefined){
                    callback(null, false);
                }else{
                    handshakeData.userId = userId;
                    handshakeData.villageId = villageId;
                    callback(null, true);
                }
            }).bind(this))
            .catch(function(){
                callback(null, false);
            });
        }).bind(this));
        this.io.on('connection', this.onconnection.bind(this));
        
        this.socket.onGet('maxUserCount', this.onGet_maxUserCount.bind(this));
        this.socket.onGet('addressAndPort', this.onGet_addressAndPort.bind(this));
        this.socket.onGet('createVillage', this.onGet_createVillage.bind(this));
        this.socket.onGet('village::createUser', this.onGet_village_createUser.bind(this));
        
        this.maxUserCount = 100;
        this.address = address;
        this.port = port;
        
        this.villages = {};
        
        this.lastUpdate = now();
        setInterval(this.update.bind(this), 1000/66);
    }
    
    SlaveClient.prototype.onconnected = function(){
        console.log("connected");
    };
    
    SlaveClient.prototype.ondisconnect = function(){
        console.log("disconnected");
    };
    
    SlaveClient.prototype.onGet_maxUserCount = function(){
        return this.maxUserCount;
    };
    
    SlaveClient.prototype.onGet_addressAndPort = function(){
        return {
            address : this.address,
            port : this.port,
        };
    };
    
    SlaveClient.prototype.onGet_createVillage = function(villageId){
        var village = this.villages[villageId] = new Village(villageId);
        return village.established;
    };
    
    SlaveClient.prototype.onGet_village_createUser = function(data){
        console.log("test", data);
        var villageId = data.villageId;
        var userId = data.userId;
        var village = this.villages[villageId];
        if(village !== undefined){
            return village.waitForUser(userId);
        }
    };
    
    SlaveClient.prototype.onconnection = function(socket){
        var userId = socket.handshake.userId;
        var villageId = socket.handshake.villageId;
        var village = this.villages[villageId];
        
        village.addUser(userId, socket).then((function(userObject){
            //TODO
        }).bind(this))
        /* // TODO
        .catch(function(){
            
        });
        */
        .done();
    };
    
    SlaveClient.prototype.update = function(){
        for(var villageId in this.villages){
            var village = this.villages[villageId];
            var time = now();
            var deltaTime = time - this.lastUpdate;

            village.update(time, deltaTime);
        }
        this.lastUpdate = now()
    };
    
    return SlaveClient;
});