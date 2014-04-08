var config = {
    main : require('./configs/main.json'),
    cluster : require('./configs/cluster.json'),
};

// require dependencies
var os = require('os'),
    cluster = require('cluster');


// test if current platform is windows
var isWin = /^win/.test(process.platform);

// only execute once
if(cluster.isMaster && !config.main.debug){
    // if windows or DEBUG only 1 worker because windows doesn't support redis pub/sub
    var workerCount = isWin || config.main.debug ? 1 : os.cpus().length;
    if(workerCount > config.cluster['max-worker']){
        workerCount = config.cluster['max-worker'];
    }
    // Fork workers.
    for (var i = 0; i < workerCount; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died, fork new worker');
        //cluster.fork();
    });
}

// executes for each worker
if(cluster.isWorker || config.main.debug){
    // Docs: http://requirejs.org/docs/node.html
    var requirejs = require('requirejs');
    requirejs.config({
        //Pass the top-level main.js/index.js require
        //function to requirejs so that node modules
        //are loaded relative to the top-level JS file.
        nodeRequire: require
    });

    requirejs(
        ['cluster/webserver/express',
         'cluster/socket.io',
         'cluster/webserver/assetManager',
         'cluster/webserver/villageInfo',
         'cluster/webserver/stylusCompiler',
         'cluster/webserver/requirejsOptimizer',
         'cluster/webserver/static',
         'cluster/mysqlPool',
         'general/user/login',
         'general/user/session',
         'cluster/user/session',
         'cluster/user/register',
         ], 
         function(app, io, assetManager, stylus, requireJsOptimizer, static, mysqlPool, Login, Session, ClusterSessio){
            
            
        }
    );
}


