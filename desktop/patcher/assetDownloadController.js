define([
'configs/client',
'vendors/utili/q',
'vendors/utili/path',
'desktop/patcher/downloadController',
'desktop/patcher/patcher',
'general/utili/bytesToSize',
'general/utili/now'
], 
function(config, Q, path, downloadController, patcher, bytesToSize, now){
    
    function AssetDownloadController(assets){
        this.speed = 0;
        this.leftTime = 0;
        this.progress = 0;
        this.totalBytes = this.getTotalBaytes(assets);
        this.bytesLoaded = 0;
        this.maxSimultaneousDownloads = config.maxSimultaneousDownloads;
        this.deferred = Q.defer();
        this.load = this.deferred.promise;
        this.assets = assets;
        this.queue = [];
        this.lastBytesLoaded = 0;
        this.waiting = false;
        
        this.lastCalculated = now();
        
        var intervalRef = setInterval(this.calculate.bind(this), 2000);
        
        this.load.finally((function(){
            this.speed = 0;
            this.leftTime = 0;
            this.progress = 1;
            clearInterval(intervalRef);
        }).bind(this));
        
    }
    
    AssetDownloadController.prototype.calculate = function(){
        // speed
        var bytesLoaded = this.getBytesLoaded();
        var loadedBytes = bytesLoaded - this.lastBytesLoaded;
        this.speed = loadedBytes / ((now() - this.lastCalculated) / 1000);
        this.lastBytesLoaded = bytesLoaded;
        this.lastCalculated = now();
        
        //left time
        var leftBytes = this.totalBytes - loadedBytes;
        this.leftTime = (leftBytes / this.speed) * 1000;
        
        this.deferred.notify(this);
    };
    
    AssetDownloadController.prototype.getTotalBaytes = function(assets){
        var totalBytes = 0;
        assets.forEach(function(asset){
            totalBytes += asset.stat.size;
        });
        return totalBytes;
    };
    
    AssetDownloadController.prototype.getBytesLoaded = function(){
        var bytesLoaded = this.bytesLoaded;
        this.queue.forEach(function(asset){
            if(asset.stat.loading){
                bytesLoaded += asset.stat.loadedBytes;
            }
        });
        return bytesLoaded;
    };
    
    AssetDownloadController.prototype.checkQueue = function(){
        if(this.waiting){
            return;
        }
        var dif = Math.min(this.assets.length, this.maxSimultaneousDownloads - this.queue.length);
        for (var i = 0; i < dif; i++) {
            this.startDownload(this.assets.shift());
        }
        // finished ?
        if (this.queue.length <= 0 &&
            this.assets.length <= 0){
            
            this.deferred.resolve(this);
        }
    };
    
    AssetDownloadController.prototype.startDownload = function(asset){
        patcher.downloadAsset(asset.path)
        .progress(this.onprogress.bind(this))
        .then((function(){
            this.downloadFinished(asset, true);
        }).bind(this),
        (function(){
            this.downloadFinished(asset, false);
        }).bind(this));
        
        this.queue.push(asset);
    };
    
    AssetDownloadController.prototype.downloadFinished = function(asset, successful){
        delete asset.stat.loading;
        delete asset.stat.loadedBytes;
        asset.loaded = successful;
        
        if(!successful){
            asset.stat.downloadFailed = (asset.stat.downloadFailed ? asset.stat.downloadFailed : 0) + 1;
            console.error(asset, "failed to download and save the", asset.stat.downloadFailed + '.', "time");
            this.assets.push(asset);
        }else{
            asset.stat.loaded = true;
            this.bytesLoaded += asset.stat.size;
        }
        // remove asset from queue
        var index = this.queue.indexOf(asset);
        if(index !== -1){
            this.queue.splice(index, 1);
        }
        this.checkQueue();
        this.onprogress();
    };
    
    AssetDownloadController.prototype.onprogress = function(){
        this.progress = this.getBytesLoaded() / this.totalBytes;
        this.deferred.notify(this);
    };
    
    AssetDownloadController.prototype.start = function(){
        this.checkQueue();
        this.onprogress();
    };
    
    AssetDownloadController.prototype.pause = function(){
        this.waiting = true;
    };
    
    AssetDownloadController.prototype.resume = function(){
        this.waiting = false;
        this.onprogress();
    };
    
    AssetDownloadController.prototype.stop = function(){
        this.pause();
        this.deferred.reject(new Error("AssetDownloadController stoped"));
    };
    
    return AssetDownloadController;
});