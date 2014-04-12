if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([
'cluster/config', 
'vendors/utili/Q',
'path', 
'./express',
'fs-extra',
'url-join',
'walk',
'msgpack-js',
'general/villageAssetList',
'cluster/mysqlPool',
], function(config, Q, path, app, fs, urlJoin, nodeWalker, MsgPack, villageAssetList, mysqlPool){
    
    var modelsPath = config.get('modelsPath');
    var gameObjectsPath = config.get('gameObjectsPath');
    
    Q.longStackSupport = true;
    
    var readFile = Q.denodeify(fs.readFile);
    var writeFile = Q.denodeify(fs.writeFile);
    var stat = Q.denodeify(fs.stat);
    var createFile = Q.denodeify(fs.createFile);
    var copy = function(from, to){
        return Q.Promise(function(resolve, reject) {
                
            var rd = fs.createReadStream(from);
            rd.on("error", function(err) {
                reject(err);
            });
            var wr = fs.createWriteStream(to);
            wr.on("error", function(err) {
                reject(err);
            });
            wr.on("close", function(ex) {
                resolve();
            });
            rd.pipe(wr);

        });
    };
    var jsonParse = function(data){
        return Q.Promise(function(resolve, reject) {
            resolve(JSON.parse(data));
        });
    };
    var jsonStringify = function(data){
        return Q.Promise(function(resolve, reject) {
            resolve(JSON.stringify(data));
        });
    };
    var msgpackEncode = function(data){
        return Q.Promise(function(resolve, reject) {
            resolve(MsgPack.encode(data));
        });
    };
    
    
    var converter = {
        JSONtoMsgPack : function(from, to){
            return readFile(from)
                .then(jsonParse)
                .then(msgpackEncode)
                .then(writeFile.bind(null, to))
                .then(function(){
                    return stat(to);
                });
        },
        copy : function(from, to){
            return copy(from, to)
                .then(function(){
                    return stat(to);
                });
        }
    };
    
    var getDependencies = {
        fromGameObject : function(root, objectPath, objectName){
            return readFile(path.join(root, objectPath, objectName + '.js'))
                .then(jsonParse)
                .then(function(obj) {
                    var dependencies = [];
                    var promises = [];
                    if(obj.model){
                        dependencies.push(urlJoin(modelsPath, obj.model + '.js'));
                        var dir = path.dirname(obj.model);
                        var basename = path.basename(obj.model);
                        var promise = getDependencies.fromModel(root, urlJoin(modelsPath, dir), basename)
                        .then(function(dep){
                            dependencies = dependencies.concat(dep);
                        });
                        promises.push(promise);
                    }
                    
                    if(obj.sword){
                        dependencies.push(urlJoin(modelsPath, obj.sword + '.js'));
                        var dir = path.dirname(obj.sword);
                        var basename = path.basename(obj.sword);
                        var promise = getDependencies.fromModel(root, urlJoin(modelsPath, dir), basename)
                        .then(function(dep){
                            dependencies = dependencies.concat(dep);
                        });
                        promises.push(promise);
                    }
                    
                    if(obj.heightCollider){
                        dependencies.push(urlJoin(modelsPath, obj.heightCollider + '.js'));
                    }
                    
                    return Q.all(promises).then(function(){
                        return dependencies;
                    });
                    
                });
        },
        fromModel : function(root, modelPath, modelName){
            return readFile(path.join(root, modelPath.replace('/', path.sep), modelName + '.js'))
                .then(jsonParse)
                .then(function(obj) {
                    var dependencies = [];
                    if(obj.materials){
                        var materials = obj.materials;
                        for (var i = 0; i < materials.length; i++) {
                            var material = materials[i];
                            var materialDependencies = getDependencies.fromMaterial(modelPath, material);
                            dependencies = dependencies.concat(materialDependencies);
                        }
                    }
                    return dependencies;
                });
        },
        fromMaterial : function(modelPath, material){
            var dependencies = [];
            var maps = ['mapDiffuse', 'mapLight', 'mapBump', 'mapNormal', 'mapSpecular'];
            for (var i = 0; i < maps.length; i++) {
                var mapName = maps[i];
                var mapPath = material[mapName];
                if(mapPath){
                    dependencies.push(urlJoin(modelPath.replace(path.sep, '/'), mapPath));
                }
            }
            return dependencies;
        }
    };
    
    function Asset(filePath, size, dependencies){
        this.filePath = filePath;
        this.size = size;
        this.dependencies = dependencies;
    }
    
    
    function AssetManager(assetPath, storeDirectory){
        this.assetPath = assetPath;
        this.storeDirectory = storeDirectory;
        this.assetDependencies = {};
        this.assets = {};
        this.ready = Q.Promise((function(resolve, reject) {
            this.loadAllDependencies()
            .then(this.checkAllFileChanges.bind(this))
            .then((function(){
                
            }).bind(this))
            .then(resolve)
            .catch(reject);
        }).bind(this))
        .done();
        this.list = {
            dependencies : this.assetDependencies,
            assets : this.assets,
        };
    }
    
    AssetManager.prototype.loadAllDependencies = function(){
        var promises = [];
        var assetDirOptions = [
            {
                path : gameObjectsPath,
                getDependencies : getDependencies.fromGameObject,
                fileExtensions : ['.js'],
            },
            {
                path : modelsPath,
                getDependencies : getDependencies.fromModel,
                fileExtensions : ['.js'],
            }
        ];
        for (var i = 0; i < assetDirOptions.length; i++) {
            promises.push(this.loadDependencies(assetDirOptions[i]));
        }
        return Q.all(promises);
    }
    AssetManager.prototype.loadDependencies = function(assetOptions){
        
        var walker = nodeWalker.walk(path.join(this.assetPath, assetOptions.path));
        var deferred = Q.defer();
        var allDepsPromises = [];
        walker.on('file', (function(root, fileStats, next){
            var dir = root.replace(this.assetPath, '');
            var extname = path.extname(fileStats.name)
            if(assetOptions.fileExtensions.indexOf(extname) === -1){
                next();
                return;
            }
            var name = path.basename(fileStats.name, extname);
            var fullName = urlJoin(dir, fileStats.name);
            var promise = assetOptions.getDependencies(this.assetPath, dir, name)
            .then((function(dependencies){
                this.assetDependencies[fullName] = dependencies;
            }).bind(this));
            
            allDepsPromises.push(promise);
            next();
        }).bind(this));
        walker.on('end', function(){
            Q.all(allDepsPromises)
            .then(deferred.resolve, deferred.reject);
        });
        
        return deferred.promise;
    };
    
    AssetManager.prototype.checkAllFileChanges = function(){
        var promises = [];
        for(var assetName in this.assetDependencies){
            promises.push(this.checkFileChanges(assetName));
            var dependencies = this.assetDependencies[assetName];
            for(var i = 0; i < dependencies.length; i++){
                var name = dependencies[i];
                promises.push(this.checkFileChanges(name));
            }
        }
        return Q.all(promises);
    };
    
    AssetManager.prototype.checkFileChanges = function(assetName){
        var from = path.join(this.assetPath, assetName.replace('/', path.sep));
        var to = path.join(this.storeDirectory, assetName.replace('/', path.sep));
        
        return Q.Promise((function(resolve, reject) {
            if(this.assets[assetName] !== undefined){
                resolve();
                return;
            }
            
            this.assets[assetName] = {};
            
            
            Q.all([
                stat(from),
                stat(to),
            ]).spread((function(fromStat, toStat){
                var fromLastM = fromStat.mtime.getTime();
                var toLastM = toStat.mtime.getTime();
                if(fromLastM > toLastM){
                    this.convertAndSave(from, to)
                    .then(resolve).catch(reject);
                }else{
                    resolve(fromStat);
                }
            }).bind(this)).catch((function(){
                this.convertAndSave(from, to)
                .then(resolve).catch(reject);
            }).bind(this));
        }).bind(this))
        .then((function(stats){
            if(!stats){
                return;
            }
            return this.getSize(from, to)
            .then((function(size){
                this.assets[assetName] = {
                    size : size,
                    mtime : stats.mtime.getTime(),
                };
            }).bind(this));
        }).bind(this));
    };
    
    AssetManager.prototype.convertAndSave = function(from, to){
        var ext = path.extname(from);
        return createFile(to)
        .then(function(){
            switch (ext) {
                case '.js':
                    return converter.JSONtoMsgPack(from, to);
                default:
                    return converter.copy(from, to);
            }
        });
        
    };
    
    AssetManager.prototype.getSize = function(from, to){
        var ext = path.extname(from);
        switch (ext) {
            case '.js':
                return readFile(from)
                    .then(jsonParse)
                    .then(jsonStringify)
                    .then(function(data){
                        var buffer = new Buffer(data);
                        return buffer.length;
                    });
            default:
                return stat(to)
                    .then(function(stat){
                        return stat.size;
                    });
        }
    };
    
    AssetManager.prototype.route = function(req, res){
        res.header('Content-type', 'application/json');
        if(config.get('debug')){
            res.send(JSON.stringify(this.list, null, 4));
        }else{
            res.send(JSON.stringify(this.list));
        }
    };
    
    //get root dir
    var rootDir = path.dirname(require.nodeRequire.main.filename);
    
    var assetPath = config.get('assetPath');
    var staticDir = config.get('staticDirectory');
    var assetManager = new AssetManager(path.join(rootDir, assetPath), path.join(rootDir, staticDir, assetPath));
    
    app.get('/assets/list.js', assetManager.route.bind(assetManager));
    
    app.get('/assets/villageList.js', function(req, res){
        var villageId = req.query.villageId || 0;
        villageAssetList.create(config, mysqlPool, villageId)
        .then(function(list){
            res.header('Content-type', 'application/json');
            if(config.get('debug')){
                res.send(JSON.stringify(list, null, 4));
            }else{
                res.send(JSON.stringify(list));
            }
        }).done();
    });
});