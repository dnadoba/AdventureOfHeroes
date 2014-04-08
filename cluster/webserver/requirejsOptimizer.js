/**
 * Created by Jango on 06.03.14.
 */

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
    ['cluster/config', 'path', './express', 'requirejs', 'fs', 'url-join'],
    function(config, path, app, requirejs, fs, urlJoin){

        //get root dir
        var rootDir = path.dirname(require.nodeRequire.main.filename);

        // configs
        var requireJsBuilds = config.get('requireJsBuilds');


        function build(buildConfig, cb){
            if (config.get('debug') &&
                buildConfig.optimize === undefined){
                buildConfig.optimize = 'none';
            }
            requirejs.optimize(buildConfig, cb);
        }

        var files = {};

        for(var i = 0; i < requireJsBuilds.length; i++){
            var buildConfig = requireJsBuilds[i];

            // rebuild only in debug mode
            if(config.get('debug')){
                // request file paths
                var filePath = urlJoin('/', buildConfig.out);
                files[filePath] = buildConfig;
            }


            if(!config.get('debug')){
                // absoulte paths
                buildConfig.baseUrl = path.join(rootDir, buildConfig.baseUrl.replace('/', path.sep));
                buildConfig.out = path.join(rootDir, config.get('staticDirectory').replace('/', path.sep), buildConfig.out.replace('/', path.sep));
                build(buildConfig, function(buildResponse){
                   //console.log(buildResponse);
                });
            }
        }
        
        // only rebuild in config mode
        if(config.get('debug')){
            var requireJsPath = config.get('requireJsPath');
            app.use(function(req, res, next){
                var buildConfig = files[req.originalUrl];
                if(buildConfig !== undefined){
                    var clientConfig = buildConfig;
                    var requireConfigFunc = 'require.config(' + JSON.stringify(clientConfig) + ');\n';
                    fs.readFile(path.join(rootDir, buildConfig.baseUrl, buildConfig.name), function(error, script){
                        if(error){
                            console.log(error);
                            res.send(500, error);
                        }else{
                            var data = requireConfigFunc + script;
                            if(buildConfig.worker){
                                var importScripts = 'importScripts("/' + requireJsPath + '");\n';
                                data = importScripts + data.replace(importScripts, '');
                            }
                            res.setHeader('Content-Type', 'application/javascript');
                            res.send(data);
                        }
                    });
                    
                }else{
                    next();
                }
            });
        }
    }
);