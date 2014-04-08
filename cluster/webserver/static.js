/**
 * Created by Jango on 06.03.14.
 */

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
    ['cluster/config', 'express', './express', 'path'],
    function(config, express, app, path){
        //get root dir
        var rootDir = path.dirname(require.nodeRequire.main.filename);

        // setup static file server
        var staticDirectory = path.join(rootDir, config.get('staticDirectory'));
        app.use(express.static(staticDirectory));
        
        // in debug mode add the root directory as the seccond static direcotry
        if(config.get('debug')){
            app.use(express.static(rootDir));
        }
    }
);