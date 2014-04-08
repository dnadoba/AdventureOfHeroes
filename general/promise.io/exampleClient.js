
var requirejs = require("requirejs");

requirejs([
'general/promise.io/client'
], 
function(PromiseClient){
    var client = new PromiseClient(8100, '127.0.0.1', "password");
    
    // post some data to the server
    client.post('console.log', "Hallo Welt ;)");
    
    // get some data from the server
    client.get('users')
    .then(function(users){
        console.log("Users:", users.join(', '));
    })
    .catch(function(error){
        console.error(error);
    });
    
    client.onGet('hello', function(){ 
        return 'Hello ;)';
    });
    
    
});