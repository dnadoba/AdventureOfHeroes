define([
'vendors/utili/q',    
], function(Q){
    function Xhr(){
        this.deferred = Q.defer();
        this.load = this.deferred.promise;
        this.xhr = new XMLHttpRequest();
        this.xhr.onload = this.onload.bind(this);
        this.xhr.onprogress = this.onprogress.bind(this);
        this.xhr.onerror = this.onerror.bind(this);
    }
    
    Xhr.prototype.open = function(){
        this.xhr.open.apply(this.xhr, arguments);
        return this;
    };
    
    Xhr.prototype.send = function(){
        this.xhr.send.apply(this.xhr, arguments);
        return this.load;
    };
    Xhr.prototype.onload = function(){
        if(this.xhr.status === 200){
            this.deferred.resolve(this.xhr.response);
        }else{
            this.deferred.reject(new Error("HTTP Status: "+ this.xhr.status));
        }
    };
    
    Xhr.prototype.onprogress = function(event){
        this.deferred.notify(event.loaded / event.total);
    };
    
    Xhr.prototype.onerror = function(error){
        this.deferred.reject(error);
    };
    
    Xhr.get = function(url){
        var xhr = new Xhr();
        return xhr.open('GET', url, true).send();
        
    };
    
    Xhr.getJSON = function(url){
        return Xhr.get(url)
        .then(function(response){
            return JSON.parse(response);
        });
    };
    
    return Xhr;
});