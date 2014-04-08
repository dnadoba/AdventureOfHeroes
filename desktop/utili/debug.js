define([
'configs/client'
], function(config){
    var debug = config.debug;
    function Debug(){
        this.element = document.createElement('div');
        this.element.classList.add('debugWindow')
        
        this.divs = {};
        
        if(debug){
            document.body.appendChild(this.element);
        }
    }
    
    Debug.prototype.createDiv = function(){
        var div = document.createElement('div');
        this.element.appendChild(div);
        return div;
    };
    
    Debug.prototype.getDivOrCreate = function(key){
        var div = this.divs[key];
        if(!div){
            div = this.divs[key] = this.createDiv();
        }
        return div;
    };
    
    Debug.prototype.logValue = function(key, value, stringify){
        var div = this.getDivOrCreate(key);
        div.innerHTML = key + ': ' + (stringify ? JSON.stringify(value) : value);
    };
    
    Debug.prototype.log = function(key, values){
        values = Array.prototype.slice.call(arguments, 1);
        var div = this.getDivOrCreate(key);
        div.innerHTML = key +': ' + values.join(' ');
    };
    
    Debug.prototype.hideValue = function(key){
        var div = this.divs[key];
        if(div){
            this.element.removeChild(div);
        }
    };
    
    return new Debug();
});