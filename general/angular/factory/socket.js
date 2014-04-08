define(['general/socket', 'aoh'], function(socket, aoh){
    aoh.constant('CONNECTION_STATUS', {
        CONNECTED : 'SOCKET_CONNECTED',
        DISCONNECTED : 'SOCKET_DISCONNECTED',
        CONNECTING : 'SOCKET_CONNECTING',
    });
    aoh.factory('socket', ['$rootScope', 'CONNECTION_STATUS', function($rootScope, CONNECTION_STATUS){
        $rootScope.socket = {};
        $rootScope.socket.status = CONNECTION_STATUS.DISCONNECTED;
        $rootScope.socket.connected = false;
        var ngSocket = {
            connected : false,
            status : CONNECTION_STATUS.DISCONNECTED,
            once : function(eventName, callback){
                socket.once(eventName, function(){
                    var args = arguments;
                    $rootScope.$apply(function(){
                        callback.apply(socket, args);
                    });
                });
            },
            on : function(eventName, callback){
                socket.on(eventName, function(){
                    var args = arguments;
                    $rootScope.$apply(function(){
                        callback.apply(socket, args);
                    });
                });
            },
            emit : function(eventName){
                
                var args = Array.prototype.slice.call(arguments, 0);
                // last argument maybe a function
                if(typeof args[arguments.length - 1] == 'function'){
                    var callback = args.pop();
                    args.push(function(){
                        var args = arguments;
                        $rootScope.$apply(function(){
                            callback.apply(socket, args);
                        });
                    });
                }
                socket.emit.apply(socket, args);
            },
        };
        ngSocket.on('connect', function(){
            $rootScope.socket.status = ngSocket.status = CONNECTION_STATUS.CONNECTED;
            $rootScope.socket.connected = ngSocket.connected = true;
        });
        ngSocket.on('disconnect', function(){
            $rootScope.socket.status = ngSocket.status = CONNECTION_STATUS.DISCONNECTED;
            $rootScope.socket.connected = ngSocket.connected = false;
        });
        ngSocket.on('connecting', function(){
            $rootScope.socket.status = ngSocket.status = CONNECTION_STATUS.CONNECTING;
            $rootScope.socket.connected = ngSocket.connected = false;
        });
        if(socket.socket.connected){
            $rootScope.socket.status = ngSocket.status = CONNECTION_STATUS.CONNECTED;
            $rootScope.socket.connected = ngSocket.connected = true;
        }else if(socket.socket.connecting){
            $rootScope.socket.status = ngSocket.status = CONNECTION_STATUS.CONNECTING;
            $rootScope.socket.connected = ngSocket.connected = false;
        }
        return ngSocket;
    }]);
});