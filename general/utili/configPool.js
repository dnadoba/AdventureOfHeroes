if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([], function(){
    /**
     * Config helper
     * @param {...Object} config - one or more configs, the order is importen!
     */
   function ConfigPool(configs){
       this.configs = Array.prototype.slice.call(arguments, 0);
       /**
        * gets a key from the config
        * @param {String|Array} key - a string seperated by '.' or an array
        * @throws Will throw an error if the key is not found in the config
        * @returns {Object} the value bhind the key
        */
       this.get = function(key){
           
           for(var i = 0; i < this.configs.length; i++){
               var config = this.configs[i];
               var value = this._get(key, config);
               if(value !== undefined){
                   return value;
               }
           }
           
           throw new Error('can\'t find "' + key + '" in ConfigPool');
       };
       
       this._get = function(key, config){
           var keys = key instanceof Array ? key : key.split('.');
           key = keys.shift();
           
           var value = config[key];
           
           if(value !== undefined){
               if(keys.length > 0){
                   return this._get(keys, value);
               }else{
                   return value;
               }
           }else{
               return undefined;
           }
       };
       
   } 
   return ConfigPool;
});