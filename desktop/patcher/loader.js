define(['vendors/utili/q'], function(Q){
    
    function Loader(){
        this.xhr = new XMLHttpRequest();
        this.deferred = Q.defer();
    }
    /**
     * @returns {Promise} promise - returns a promise
     */
    Loader.prototype.promise = function(){
        return this.deferred.promise;
    };
    
    /**
     * @param {String} url - url to load
     */
    
    Loader.prototype.load = function(url){
        this.xhr.open("GET", url, true);
        this.xhr.onload = this.onload.bind(this);
        this.xhr.onprogress = this.onprogress.bind(this);
        this.xhr.onerror = this.onerror.bind(this);
        
        
    };
    
    Loader.prototype.onload = function(){};
    
    Loader.prototype.onprogress = function(event){
        this.deferred.notify(event.loaded / event.total);
    };
    
    Loader.prototype.onerror = function(error){
        this.deferred.reject(error);
    };
    
    /**
     * abort the xhr request and reject the promise
     */
    Loader.prototype.abort = function(){
        this.xhr.abort();
        this.deferred.reject(new Error('abort'));
    };
    
    
    return Loader;
});