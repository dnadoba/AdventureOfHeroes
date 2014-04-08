define([
'vendors/utili/q',
'vendors/utili/path',
'desktop/worker/promiseWorkController.js',
], 
function(Q, path, promiseWorkController){
    function DownloadController(){
        promiseWorkController.call(this, 'desktop/scripts/worker/downloader.js');
    }
    
    DownloadController.prototype = Object.create(promiseWorkController.prototype);
    
    DownloadController.prototype.downloadAndSave = function(filePath){
        return this.emit('downloadAndSave', filePath);
    };
    
    DownloadController.prototype.requestFileSystem = function(quota){
        return this.emit('requestFileSystem', quota);
    };
    
    return new DownloadController();
});