define(['configs/client', 'socket.io'], function(config, io){
    //origin
    var url = location.protocol + '//' + location.host;
    
    var socket = io.connect(url, {
        // client version
        query : "version=" + config.version,
        "auto connect" : false,
    });
    return socket;
});