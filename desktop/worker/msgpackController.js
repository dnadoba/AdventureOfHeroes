define(['./controller'], function(WorkerController){
    function MsgpackController(){
        WorkerController.call(this, 'desktop/scripts/worker/msgpack.js');
    }
    MsgpackController.prototype = Object.create(WorkerController.prototype);
    MsgpackController.prototype.unpack = function(data){
        return this._postMessage({
            type : 'unpack', 
            data : data,
        }, [data]);
    };
    MsgpackController.prototype.pack = function(data){
        return this._postMessage({
            type : 'pack', 
            data : data,
        });
    };
    MsgpackController.prototype.unpackAndStringify = function(data){
        return this._postMessage({
            type : 'unpackAndStringify', 
            data : data,
        }, [data]);
    };
    return MsgpackController;
});