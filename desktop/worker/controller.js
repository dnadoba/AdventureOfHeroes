define(['vendors/utili/q'], function(Q){
    function WorkerController(url){
        this.worker = new Worker(url);
        this.worker.postMessage = this.worker.webkitPostMessage || this.worker.postMessage;
        this.worker.onmessage = this.__onmessage.bind(this);
        this.worker.onerror = this.__onerror.bind(this);
        this.queue = [];
    }
    WorkerController.prototype.__onmessage = function(event){
        var deferred = this.queue.shift();
        this._onmessage(deferred, event);
    };
    WorkerController.prototype._onmessage = function(deferred, event){
        deferred.resolve(event.data);
    };
    WorkerController.prototype.__onerror = function(error){
        var deferred = this.queue.shift();
        this._onerror(deferred, event);
    };
    WorkerController.prototype._onerror = function(deferred, error){
        deferred.reject(error.data);
    };
    WorkerController.prototype._postMessage = function(data, transfarables){
        var deferred = Q.defer();
        this.queue.push(deferred);
        this.worker.postMessage(data, transfarables);
        return deferred.promise;
    };
    return WorkerController;
});