
var requirejs = require("requirejs");

requirejs([
'general/promise.io/server',
'vendors/utili/q'
], 
function(PromiseServer, Q){
    var server = new PromiseServer();
    server.sendErrorMessage = true;
    server.setWhiteList(['127.0.0.1']);
    server.setAuthKey('password');
    
    var users = ['Test User', 'Jango', 'David'];
    
    
    server.onGet("users", function(){
        return users;
    });
    server.onPost("console.log", function(){
        console.log.apply(console, arguments);
    });
    
    server.on('connection', function(client){
        client.get('hello').then(function(msg){
            console.log(msg);
        }).done();
        client.on('end', function(){
            console.log("Client end :(");
        });
    });
    server.listen(8100);
    console.log("PromiseServer listen on Port", server.port);
});