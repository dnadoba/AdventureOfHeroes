if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
['vendors/utili/q', 'general/user/login', 'cluster/mysqlPool', 'cluster/socket.io', 'general/user/session'], 
function(Q, Login, mysqlPool, io, Session){
   
   var login = new Login(mysqlPool);
   io.on('connection', function(socket){
       function establishSession(loginPromise, callback){
           loginPromise.then(function(userData){
               var session = Session.create(userData, socket, mysqlPool);
               callback(true, session.clientData());
           }).catch(function(error){
               callback(false);
           });
       }
       
       socket.on('loginBySession', function(hash, callback){
           var promise = login.bySession(hash);
           establishSession(promise, callback);
       });
       
       socket.on('loginByAuth', function(email, password, callback){
           var promise = login.byAuth(email, password);
           establishSession(promise, callback);
       });
   });
});