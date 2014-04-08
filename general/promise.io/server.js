define([
'vendors/utili/q',
'json-over-tcp',
'./socket',
'events'
], 
function(Q, jot, PromiseSocket, events){
    function PromiseServer(){
        this.server = jot.createServer();
        this.server.on('connection', this.onconnection.bind(this));
        this.reconnect = true;
        this.port = 0;
        this.host = undefined;
        this.backlog = undefined;
        this.encoding = 'utf8';
        this.whiteliste = {};
        this.authKey = "";
        this.getFunctions = {};
        this.postFunctions = {};
        this.sendErrorMessage = true;
    }
    PromiseServer.prototype = Object.create(events.EventEmitter.prototype);
    
    PromiseServer.prototype.setAuthKey = function(key){
        this.authKey = key;
    };
    
    PromiseServer.prototype.setWhiteList = function(whiteliste){
        this.whiteliste = {};
        for (var i = 0; i < whiteliste.length; i++) {
            var addr = whiteliste[i];
            this.whiteliste[addr] = true;
        }
    };
    
    PromiseServer.prototype.listen = function(port, host, backlog, callback){
        this.port = port;
        this.host = host;
        this.backlog = backlog;
        this._listen(callback);
    };
    
    PromiseServer.prototype._listen = function(callback){
        this.server.listen(this.port, this.host, this.backlog, callback);
    };
    
    PromiseServer.prototype.onconnection = function(socket){
        //socket.setEncoding(this.encoding);
        this.checkWhitelist(socket)
        .then(this.authSocket.bind(this))
        .then((function(socket){
            var promiseSocket = new PromiseSocket(socket, this.getFunctions, this.postFunctions);
            socket.write('ESTABILISHED', this.encoding);
            this.emit('connection', promiseSocket);
        }).bind(this))
        .catch((function(error){
            console.log(error);
            if(this.sendErrorMessage){
                socket.write(error.toString() + '\n', this.encoding);
            }
            socket.destroy();
        }).bind(this));
    };
    
    PromiseServer.prototype.checkWhitelist = function(socket){
        return Q.Promise((function(resolve, reject){
            var addr = socket.remoteAddress;
            var check = this.whiteliste[addr] === true;
            if(check){
                resolve(socket);
            }else{
                reject("IP NOT IN WHITELIST");
            }
        }).bind(this));
    };
    
    PromiseServer.prototype.authSocket = function(socket){
        return Q.Promise((function(resolve, reject){
            socket.once('data', (function(masterAuthKey){
                if(this.authKey == masterAuthKey.toString()){
                    resolve(socket);
                }else{
                    reject("AUTH FAIL");
                }
            }).bind(this));
        }).bind(this));
    };
    
    PromiseServer.prototype.onGet = function(funcName, func){
        this.getFunctions[funcName] = func;
    };
    PromiseServer.prototype.onPost = function(funcName, func){
        this.postFunctions[funcName] = func;
    };
    return PromiseServer;
});