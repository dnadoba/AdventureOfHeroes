define([
'configs/client', 
'vendors/utili/q',
'vendors/utili/path',
'general/utili/xhr',
'desktop/patcher/downloadController',
], 
function(config, Q, path, Xhr, downloadController, AssetDownloadController){
    Q.longStackSupport = true;
    
    navigator.persistentStorage = navigator.persistentStorage || navigator.webkitPersistentStorage;
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    //Q.longStackSupport = true;
    function Patcher(){
        this.deferred = Q.defer();
        this.ready = this.deferred.promise;
        
        this.usage = 0;
        this.quota = 0;
        
        this.stats = {};
        this.fs;
        
        this.assets = {};
        this.assetDependencies = {};
        this.list = Xhr.getJSON('/assets/list.js');
        this.list.then((function(list){
            this.assets = list.assets;
            this.dependencies = list.dependencies;

            return this.forEachFile((function(fileEntry){
                return Q.Promise((function(resolve, reject){
                    var fullPath = fileEntry.fullPath;
                    var asset = this.assets[fullPath];
                    // not in the asset list
                    if (asset === undefined ||
                    // delete all files for debuging
                        config.deleteAllFiles){
                            
                        fileEntry.remove(resolve, reject);
                    }else{
                        fileEntry.getMetadata(function(metadata){
                            var mtime = metadata.modificationTime.getTime();
                            var size = metadata.size;
                            //Not up to date
                            if (mtime < asset.mtime ||
                                size != asset.size){
                                asset.loaded = false;
                            // all okay
                            }else{
                                asset.loaded = true;
                            }
                            resolve();
                        }, reject);
                    }
                }).bind(this));
                
            }).bind(this));
        }).bind(this))
        .then(this.deferred.resolve, this.deferred.reject)
        
    }
    /**
     * query usage and quota and store it in the object instance
     * @returns {Promise} promise
     */
    Patcher.prototype.queryUsageAndQuota = function(){
        return Q.Promise((function(resolve, reject){
            navigator.persistentStorage.queryUsageAndQuota((function(usage, quota){
                this.usage = usage;
                this.quota = quota;
                resolve({
                    usage : usage,
                    quota : quota,
                });
            }).bind(this), reject);
        }).bind(this));
    };
    /**
     * checks if we have enough quota
     * @returns {Promise} promise - Promise will resolve if we have enough quota, rejected otherwise
     */
    Patcher.prototype.hasEnoughQuota = function(){
        return this.queryUsageAndQuota()
        .then((function(){
            if(this.quota >= config.neededQuata){
                return true;
            }else{
                throw new Error('don\'t get enogh quota');
            }
        }).bind(this));
    };
    /**
     * request quota
     * @returns {Promise} promise - promise resolve if request is successful, rejected otherwise
     */
    Patcher.prototype.requestQuota = function(){
        return Q.Promise((function(resolve, reject){
            navigator.persistentStorage.requestQuota(config.neededQuata, (function(grantedBytes){
                this.quota = grantedBytes;
                if(this.quota >= config.neededQuata){
                    resolve(this.quota);
                }else{
                    reject();
                }
            }).bind(this), function(error){
                reject(error);
            });
        }).bind(this)).then(function(quota){
            downloadController.requestQuota(quota);
            return quota;
        });
    };
    
    Patcher.prototype.requestFileSystem = function(){
        return Q.when(this.fs || Q.Promise((function(resolve, reject){
            window.requestFileSystem(window.PERSISTENT, this.quota, resolve, reject);
        }).bind(this)).then((function(fs){
            
            this.fs = fs;
            return fs;
        }).bind(this))).catch(function(error){
            console.log(error);
        });
    };
    
    Patcher.prototype.forEachFile = function(callback, context){
        return this.requestFileSystem()
        .then(function(fs){
            return Patcher.prototype.forEachFileInDirectory(fs.root, callback, context);
        });
    };
    
    Patcher.prototype.forEachFileInDirectory = function(dir, callback, context){
        var deferred = Q.defer();
        
        var dirReader = dir.createReader();
        var promises = [];
        function read(){
            dirReader.readEntries(function(results){
                if(results.length > 0){
                    for(var i = 0; i < results.length; i++){
                        var entry = results[i];
                        if(entry.isDirectory){
                            var promise = Patcher.prototype.forEachFileInDirectory(entry, callback, context);
                            promises.push(promise);
                        // file
                        }else{
                            var promiseOrValue = Q.when(callback.call(context, entry));
                            promises.push(promiseOrValue);
                        }
                    }
                    read();
                }else{
                    // no more results
                    Q.all(promises)
                    .then(deferred.resolve, deferred.reject);
                }
            }, deferred.reject);
        }
        read();
        
        return deferred.promise;
    };
    
    Patcher.prototype.downloadAsset = function(assetPath, size){
        var asset = this.assets[assetPath];
        if(!asset){
            asset = this.assets[assetPath] = {
                size : size || 0,
                mtime : (new Date()).getTime(),
            };
        }
        return Q.Promise((function(resolve, reject, notify){
            if(asset.loaded){
                resolve();
            }else{
                var loading;
                if(asset.loading){
                    loading = asset.loading;
                }else{
                    asset.loadedBytes = 0;
                    loading = asset.loading = downloadController.downloadAndSave(assetPath);
                }
                loading.then(resolve, reject, (function(progress){
                    asset.loadedBytes = asset.size * progress;
                    notify(progress);
                }).bind(this));
            }
        }).bind(this));
    };
    
    Patcher.prototype.getAssetURL = function(assetPath, size){
        return this.downloadAsset(assetPath, size)
        .then(this.requestFileSystem.bind(this))
        .then(function(fs){
            return Q.Promise(function(resolve, reject){
                fs.root.getFile(assetPath, {create:false}, function(fileEntry){
                    resolve(fileEntry.toURL());
                }, function(error){
                    reject(error);
                });
            });
        });
    };
    
    Patcher.prototype.getAllNotLoadedAssets = function(assets){
        var notLoadedMap = {};
        var assetsNotLoaded = [];
        var self = this;
        function addFile(assetPath){
            var asset = self.assets[assetPath];
            // allready loaded
            if(asset && asset.loaded){
                return;
            }
            
            if(!asset){
                asset = self.assets[assetPath] = {
                    size : 0,
                    mtime : (new Date()).getTime(),
                };
            }
            
            // allready in download list
            if(notLoadedMap[assetPath]){
                return;
            }
            
            notLoadedMap[assetPath] = asset;
            assetsNotLoaded.push({
                path : assetPath,
                stat : asset,
            });
            
        }
        
        assets.forEach(function(assetPath){
            addFile(assetPath);
            var dependencies = this.dependencies[assetPath];
            if(dependencies){
                dependencies.forEach(function(assetPath){
                    addFile(assetPath);
                }, this);
            }
        }, this);
        

        return assetsNotLoaded;
    };
    
    return new Patcher();
});