define([
'vendors/utili/q',
'json-over-tcp',
'./socket',
'events',
], 
function(Q, jot, PromiseSocket, events){
    function PromiseClient(port, host, masterKey){
        //call super constructor
        events.EventEmitter.call(this);
        this.port = port;
        this.host = host;
        
        this.masterKey = masterKey;
        this.queue = [];
        
        this.encoding = 'utf8';
        
        this.connected = false;
        
        var socket = jot.createConnection(this.port, this.host, this.onconnect.bind(this));
        socket.on('error', this.onerror.bind(this));
        socket.on('end', this.onend.bind(this));
        
        this.getFunctions = {};
        this.postFunctions = {};
        
        this.socket = new PromiseSocket(socket, this.getFunctions, this.postFunctions);
        
        this.reconnect = true;
        this.reconnectDelay = 500;
        
        this.setEncoding(this.encoding);
    }
    
    // inherits from events.EventEmitter
    PromiseClient.prototype = Object.create(events.EventEmitter.prototype);
    
    PromiseClient.prototype.setEncoding = function(encoding){
        this.encoding = encoding;
        this.socket.encoding = this.encoding;
    };
    PromiseClient.prototype.onconnect = function(){
        var socket = this.socket.socket;
        socket.write(this.masterKey, this.encoding);
        socket.once('data', (function(data){
            if(data === 'ESTABILISHED'){
                while(this.queue.length > 0){
                    var func = this.queue.shift();
                    func();
                }
            }
            this.connected = true;
            this.emit('connected');
        }).bind(this));
    };
    PromiseClient.prototype.onerror = function(error){
        if(this.connected){
            this.emit('disconnect');
        }
        this.connected = false;
        if(this.reconnect){
            setTimeout((function() {
                this.reconnectSocket();
            }).bind(this), this.reconnectDelay);
        }
    };
    PromiseClient.prototype.onend = function(){
        if(this.connected){
            this.emit('disconnect');
        }
        this.connected = false;
        if(this.reconnect){
            setTimeout((function() {
                this.reconnectSocket();
            }).bind(this), this.reconnectDelay);
        }
    }
    PromiseClient.prototype.reconnectSocket = function(){
        var socket = new jot.createConnection(this.port, this.host, this.onconnect.bind(this));
        socket.on('error', this.onerror.bind(this));
        socket.on('end', this.onend.bind(this));
        this.socket = new PromiseSocket(socket, this.getFunctions, this.postFunctions);
    };
    PromiseClient.prototype.onGet = function(funcName, func){
        this.getFunctions[funcName] = func;
    };
    PromiseClient.prototype.onPost = function(funcName, func){
        this.postFunctions[funcName] = func;
    };
    PromiseClient.prototype.get = function(){
        if(this.connected){
            return this.socket.get.apply(this.socket, arguments);
        }else{
            var args = arguments;
            var deferred = Q.defer();
            var func = (function(){
                this.socket.get.apply(this.socket, args)
                .then(deferred.resolve, deferred.reject, deferred.notify);
            }).bind(this);
            this.queue.push(func);
            return deferred.promise;
        }
    };
    PromiseClient.prototype.post = function(){
        if(this.connected){
            return this.socket.post.apply(this.socket, arguments);
        }else{
            var args = arguments;
            var func = (function(){
                this.socket.post.apply(this.socket, args);
            }).bind(this);
            this.queue.push(func);
        }
    };
    
    return PromiseClient;
});