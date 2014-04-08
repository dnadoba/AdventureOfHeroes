importScripts("/vendors/scripts/requirejs.min.js");

/* globals: self */

var queue = [];

self.onmessage = function(event){
    queue.push(event);
};

require([
'vendors/utili/q',
'configs/client',
'desktop/worker/promiseWorker',
'vendors/utili/path',
'desktop/patcher/binaryLoader',
'desktop/patcher/jsonLoader'
], function(Q, config, PromiseWorker, path, BinaryLoader, JSONLoader){
    
    function Downloader(){
        PromiseWorker.call(this);
        
        this.on('downloadAndSave', this.downloadAndSave.bind(this));
        this.on('requestFileSystem', (function(quota){
            this.fs = this.getFilesystem(quota);
        }).bind(this));
        
        this.fs = this.getFilesystem(config.neededQuata);
        
        this.applyQueue(queue);
        delete queue;
    }
    
    Downloader.prototype = Object.create(PromiseWorker.prototype);
    
    self.requestFileSystem = self.requestFileSystem || self.webkitRequestFileSystem;
    
    Downloader.prototype.getFilesystem = function(quota){
        return Q.Promise(function(resolve, reject){
            self.requestFileSystem(self.PERSISTENT, quota, resolve, function(){
                reject();
            });
        });
    };
    
    Downloader.prototype.downloadAndSave = function(filePath){

        var downloadPath = path.join(config.assetPath, filePath);
        return this.download(downloadPath)
        .then((function(blob){
            return this.save(blob, filePath);
        }).bind(this));
    };
    
    Downloader.prototype.save = function(blob, filePath){
        var self = this;
        return this.fs.then((function(fs){
            
            return this.createFile(fs.root, filePath).then(function(fileEntry){
                
                return Q.Promise(function(resolve, reject) {
                    
                    fileEntry.createWriter(function(fileWriter){
                        fileWriter.onerror = function(event){
                                reject(event.target.error);
                            };
                        function writeFile(){
                            fileWriter.onwriteend = function(){
                                resolve();
                            };
                            
                            fileWriter.write(blob);
                        }
                        self.log("fileWrite length: " + fileWriter.length)
                        self.log("blob length: " + blob.size)
                        if(blob.size < fileWriter.length){
                            fileWriter.onwriteend = writeFile;
                            fileWriter.truncate(blob.size);
                        }else{
                            writeFile();
                        }
                        
                    }, function() {
                        reject();
                    });
                });
            });
        }).bind(this));
    };
    
    Downloader.prototype.download = function(filePath){
        var ext = path.extname(filePath);
        var Loader = ext === '.js' ? JSONLoader : BinaryLoader;
        var loader = new Loader();
        return loader.load(filePath);
    };
    
    Downloader.prototype.createFile = function(dirEntry, filePath){
        return this.createDirectorys(dirEntry, path.dirname(filePath)).then(function(){
            return Q.Promise(function(resolve, reject){
                dirEntry.getFile(filePath, {create : true}, resolve, function(){
                    reject();
                });
            });
        });
    }
    Downloader.prototype.createDirectorys = function(dirEntry, folders){
        var deferred = Q.defer();
        
        folders = path.normalize(folders).split('/').slice(1);
        
        function createDirectory(dirEntry){
            var folder = folders.shift();
            if(folder){
                dirEntry.getDirectory(folder, {create : true}, createDirectory, function(){
                    deferred.reject();
                });
            }else{
                deferred.resolve(dirEntry);
            }
        }
        createDirectory(dirEntry);
        
        return deferred.promise;
    }
    
    new Downloader();
});
