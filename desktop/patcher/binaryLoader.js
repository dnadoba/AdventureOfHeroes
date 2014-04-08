define(['./loader'], function(Loader){

    function BinaryLoader(){
        Loader.call(this);
    }
    BinaryLoader.prototype = Object.create(Loader.prototype);
    
    BinaryLoader.prototype.load = function(url){
        // call base function
        Loader.prototype.load.call(this, url);
        
        this.xhr.responseType = "blob";
        
        this.xhr.send();
        
        return this.promise();
    };
    
    BinaryLoader.prototype.onload = function(){
        this.deferred.resolve(this.xhr.response);
    };
    
    return BinaryLoader;
});