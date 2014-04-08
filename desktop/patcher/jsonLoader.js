define(['vendors/utili/q', './loader', 'vendors/msgpack'], function(Q, Loader, msgpack){
    
    function JSONLoader(){
        Loader.call(this);
    }
    JSONLoader.prototype = Object.create(Loader.prototype);
    
    JSONLoader.prototype.load = function(url){
        // call base function
        Loader.prototype.load.call(this, url);
        
        this.xhr.responseType = 'arraybuffer';
        
        this.xhr.send();
        
        return this.promise();
    };
    
    JSONLoader.prototype.onload = function(){
        Q.Promise((function(resolve, reject){
            var data = msgpack.decode(this.xhr.response)
        
            var blob = new Blob([JSON.stringify(data)], {type:'application/json'});
            resolve(blob);
        }).bind(this))
        .then(this.deferred.resolve, this.deferred.reject);
        
        
        
    };
    
    return JSONLoader;
});