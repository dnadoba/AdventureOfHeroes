define([
'vendors/utili/q',
'events'
], 
function(Q, events){    
    function PromiseSocket(socket, getFunctions, postFunctions){
        this.socket = socket;
        this.queue = {};
        this.getFunctions = getFunctions;
        this.postFunctions = postFunctions;
        this.socket = socket;
        this.socket.on('data', this.ondata.bind(this));
        this.socket.on('error', this.onerror.bind(this));
        this.socket.on('end', this.onerror.bind(this));
        this.id = 0;
        this.connected = true;
        this.myPostFunctions = {};
        this.myGetFunctions = {};
    }
    PromiseSocket.prototype = Object.create(events.EventEmitter.prototype);
    
    PromiseSocket.prototype.onerror = function(error){
        this.destroy();
    }
    PromiseSocket.prototype.onend = function(error){
        this.destroy();
    }
    
    PromiseSocket.prototype.ondata = function(data){
        if(data === 'ESTABILISHED'){
            return;
        }
        var message = data;
        try{
            switch (message.type) {
                case 'post':
                    var postFunction = this.postFunctions[message.func];
                    if(postFunction !== undefined){
                        this.postFunction(postFunction, message.args);
                    }else{
                        var myPostFunction = this.myPostFunctions[message.func];
                        if(myPostFunction !== undefined){
                            this.postFunction(myPostFunction, message.args);
                        }
                    }
                    break;
                case 'get':
                    var getFunction = this.getFunctions[message.func];
                    if(getFunction !== undefined){
                        this.getFunction(getFunction, message.args, message.id);
                    }else{
                        var myGetFunction = this.getFunctions[message.func];
                        if(myGetFunction !== undefined){
                            this.getFunction(myGetFunction, message.args, message.id);
                        }else{
                            this.sendPacket(message.id, 'reject', ['get function "' + message.func + '" not implemented']);
                        }
                    }
                    break;
                case 'resolve':
                case 'reject':
                case 'notify':
                    var id = message.id;
                    var deferred = this.queue[id];
                    if(deferred !== undefined){
                        this.onmessage(message.type, deferred, message.args, id);
                    }
                    break;
                case 'error':
                    console.error("PromiseSocket Error, reason:", message.args);
                    break;
                default:
                    throw Error("message unkown type '" + message.type + "'");
            }
        }catch(e){
            console.error(e);
        }
    };
    PromiseSocket.prototype.postFunction = function(func, args){
        func.apply(null, args);
    };
    PromiseSocket.prototype.getFunction = function(func, args, id){
        Q.when(func.apply(null, args)).then((function(){
            this.sendPacket(id, 'resolve', arguments);
        }).bind(this))
        .progress((function(){
            this.sendPacket(id, 'notify', arguments);
        }).bind(this))
        .catch((function(){
            // Convert errors to strings
            var args = arguments;
            for(var i = 0; i < args.length; i++){
                var arg = args[i];
                if(arg instanceof Error){
                    args[i] = arg.toString();
                }
            }
            this.sendPacket(id, 'reject', args);
        }).bind(this));
    };
    PromiseSocket.prototype.sendPacket = function(id, type, args){
        var message = {
            id : id,
            type : type,
            args : Array.prototype.slice.call(args, 0),
        };
        this.send(message);
    };
    PromiseSocket.prototype.send = function(message){
        
        this.socket.write(message);
    };
    PromiseSocket.prototype.onmessage = function(type, deferred, args, id){
        deferred[type].apply(deferred, args);
        if(type === 'resolve' || type === 'reject'){
            delete this.queue[id];
        }
    };
    PromiseSocket.prototype.post = function(){
        var args = Array.prototype.slice.call(arguments, 0);
        var func = args.shift();
        var message = {
            func : func,
            'type' : 'post',
            args : args,
        };
        this.send(message);
    };
    PromiseSocket.prototype.get = function(){
        var args = Array.prototype.slice.call(arguments, 0);
        var func = args.shift();
        var id = this.id++;
        if(id > 2000000000){
            id = 0;
        }
        var deferred = Q.defer();
        this.queue[id] = deferred;
        var message = {
            id : id,
            'type' : 'get',
            func : func,
            args : args,
        };
        this.send(message);
        return deferred.promise;
    };
    PromiseSocket.prototype.destroy = function(){
        if(!this.connected){
            return
        }
        this.connected = false;
        for(var id in this.queue){
            var deferred = this.queue[id];
            deferred.reject("socket destroy");
        }
        this.socket.destroy();
        this.emit('end');
    };
    PromiseSocket.prototype.onPost = function(name, func){
        this.myPostFunctions[name] = func;
    };
    PromiseSocket.prototype.onGet = function(name, func){
        this.myGetFunctions[name] = func;
    };
    return PromiseSocket;
});