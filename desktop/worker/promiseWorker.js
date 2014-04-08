/* globals: self */
define(['vendors/utili/q'], function(Q, EventEmitter){
    function PromiseWorker(){
        self.onmessage = this.onmessage.bind(this);
        this.listeners = {};
    }
    
    PromiseWorker.prototype.onmessage = function(event){
        var data = event.data;
        if(data && data.work && data.id && data.args){
            var listener = this.listeners[data.work];
            if(listener){
                var id = data.id;
                Q.when(listener.func.apply(listener.context, data.args))
                .then(
                    this.send.bind(this, id, 'resolve'),
                    (function(error){
                        this.log("Error:", error);
                        this.send(id, 'reject', error)
                    }).bind(this),
                    this.send.bind(this, id, 'notify')
                );
            }
        }
    };
    
    PromiseWorker.prototype.log = function(){
        self.postMessage({
            work : 'log',
            args : Array.prototype.slice.call(arguments, 0),
        });
    };
    
    PromiseWorker.prototype.on = function(work, func, context){
        this.listeners[work] = {
            func : func,
            context : context,
        };
    };
    
    PromiseWorker.prototype.send = function(id, stat, arg){
        self.postMessage({
            id : id,
            stat : stat,
            arg : arg,
        });
    };
    
    PromiseWorker.prototype.applyQueue = function(queue){
        queue.forEach(function(message){
            this.onmessage(message);
        }, this);
    };
    
    return PromiseWorker;
});