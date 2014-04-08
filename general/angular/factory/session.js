define(['general/socket', 'vendors/utili/q', 'general/angular/factory/socket', 'aoh'], function(socket, Q, socket, aoh){
    aoh.constant('SESSION_STATUS', {
        CHECKING : "SESSION_CHECKING",
        ESTABLISHED : "SESSION_ESTABLISHED",
        NOT_ESTABLISHED : "SESSION_NOT_ESTABLISHED",
    });
    aoh.factory('session', ['$rootScope', 'SESSION_STATUS', 'socket', function($rootScope, SESSION_STATUS, socket){
        $rootScope.session = {};
        $rootScope.session.established = false;
        $rootScope.session.checking = false;
        $rootScope.session.status = SESSION_STATUS.NOT_ESTABLISHED;
        $rootScope.session.logout = function(){
            ngSession.logout();
        };
        var ngSession = {
            hash : false,
            getHash : function(){
                return localStorage.getItem('sessionHash') || false;
            },
            setHash : function(hash){
                ngSession.hash = hash;
                localStorage.setItem('sessionHash', hash);
            },
            clearHash : function(){
                ngSession.hash = false;
                localStorage.removeItem('sessionHash');
            },
            check : function(hash){
                $rootScope.session.status = SESSION_STATUS.CHECKING;
                $rootScope.session.checking = true;
                
                return Q.Promise(function(resolve, reject){
                    socket.emit('loginBySession', hash, function(established, userData){
                        ngSession.update(established, userData);
                        if(established){
                            resolve();
                        }else{
                            reject();
                        }
                    });
                });
            },
            loginByAuth : function(email, password){
                return Q.Promise(function(resolve, reject){
                    socket.emit('loginByAuth', email, password, function(established, userData){
                        ngSession.update(established, userData);
                        if(established){
                            resolve();
                        }else{
                            $rootScope.$broadcast('sessionDestroyed');
                            reject();
                        }
                    });
                });
            },
            update : function(established, userData){
                $rootScope.session.established = established;
                $rootScope.session.checking = false;
                if(established){
                    ngSession.setUserData(userData);
                    $rootScope.session.status = SESSION_STATUS.ESTABLISHED;
                    $rootScope.$broadcast('sessionEstablished', userData);
                }else{
                    ngSession.clearHash();
                    $rootScope.session.status = SESSION_STATUS.NOT_ESTABLISHED;
                }
            },
            setUserData : function(userData){
                ngSession.setHash(userData.hash);
            },
            sendSessionHash : function(){
                var hash = ngSession.getHash();
                if(hash){
                    ngSession.check(hash);
                }
            },
            logout : function(){
                ngSession.clearHash();
                $rootScope.session.status = SESSION_STATUS.NOT_ESTABLISHED;
                $rootScope.session.established = false;
                socket.emit('sessionDestroy')
                $rootScope.$broadcast('sessionDestroyed');
            }
        };
        socket.on('sessionDestroy', function(){
            $rootScope.session.established = false;
            ngSession.clearHash();
            $rootScope.$broadcast('sessionDestroyed');
        });
        socket.on('connect', ngSession.sendSessionHash);
        if(socket.connected){
            ngSession.sendSessionHash();
        }
        
        
        return ngSession;
    }]);
});