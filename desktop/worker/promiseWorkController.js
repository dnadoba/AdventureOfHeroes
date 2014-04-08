define(['vendors/utili/q'], function(Q){
    function PromiseWorkController(workerScriptPath){
        this.worker = new Worker(workerScriptPath);
        this.worker.onmessage = this.onmessage.bind(this);
        this.work = {};
        this.lastWorkID = 0;
    }
    
    PromiseWorkController.prototype.onmessage = function(event){
        var data = event.data;
        if(data && data.id && data.stat){
            var id = data.id;
            var work = this.work[id];
            if(work){
                var stat = data.stat;
                work.deferred[stat](data.arg);
                if(stat === 'resolve' || stat === 'reject'){
                    delete this.work[id];
                }
            }
        }else if(data.work === 'log'){
            console.log.apply(console, data.args);
        }
    };
    
    PromiseWorkController.prototype.emit = function(work /*, args... */){
        var args = Array.prototype.slice.call(arguments, 1);
        
        var deferred = Q.defer();
        
        var id = this.getNextWorkID();
        
        this.worker.postMessage({
            id : id,
            work : work,
            args : args,
        });
        
        this.work[id] = {
            deferred : deferred,
        };
        
        return deferred.promise;
    };
    
    PromiseWorkController.prototype.getNextWorkID = function(){
        return ++this.lastWorkID;
    };
    
    return PromiseWorkController;
});