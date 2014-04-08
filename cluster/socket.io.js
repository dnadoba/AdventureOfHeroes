if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
    ['cluster/config', 'cluster/webserver/express', 'socket.io', 'socket.io/lib/stores/redis', 'socket.io/node_modules/redis'],
    function(config, app, socketIO, RedisStore, redis){
        var io = socketIO.listen(app.server);

        // test if current platform is windows
        var isWin = /^win/.test(process.platform);

        //use redis only if it's not windows
        if(!isWin){
            function createClient(config){
                return redis.createClient(config.port, config.host, {
                    auth_pass : config.pass,
                });
            }
            io.set('store', new RedisStore({
                redis : redis,
                redisPub : createClient(config.get('redis.pub')),
                redisSub : createClient(config.get('redis.sub')),
                redisClient : createClient(config.get('redis.client')),
            }));

        }
        
        var serverVersion = config.get('version');
        
        //handshake - ckeck the version of the client
        io.set('authorization', function(handshakeData, callback){
            var clientVersion = handshakeData.query.version;
            if(clientVersion != serverVersion){
                callback(null, false);
            }else{
                callback(null, true);
            }
        });
        
        return io;
    })
