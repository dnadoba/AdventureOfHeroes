
var requirejs = require("requirejs");

requirejs([
'core/configSlave',
'core/slave/client',
'cluster',
'os'
], 
function(config, SlaveCLient, cluster, os){
    //get ip
    var networks = os.networkInterfaces();
    var interfaces = [];
    for(var name in networks){
        var network = networks[name];
        interfaces = interfaces.concat(network);
    }
    var address = '127.0.0.1';
    for (var i = 0; i < interfaces.length; i++) {
        var interface = interfaces[i];
        if(interface.family == 'IPv4' && !interface.internal){
            address = interface.address;
            break;
        }
    }
    
    var debug = config.get('debug');
    
    if(cluster.isMaster && !debug){
        var workerCount = debug ? 1 : os.cpus().length;
        function fork(){
            var worker = cluster.fork();
        }
        // fork all worker
        for(var i = 0; i < workerCount; i++){
            fork();
        }
        cluster.on('exit', function(){
            setTimeout(function() {
                fork()
            }, 200);
        })
    //worker
    }else{
        var worker = cluster.worker || {id:1};
        var slaveClient = new SlaveCLient(
            config.get('masterServer.portForSlaves'),
            config.get('masterServer.address'),
            config.get('masterServer.authKey'),
            address,
            config.get('slave.startPort') + worker.id
        );
    }
});