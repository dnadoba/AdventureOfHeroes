if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'vendors/vector2',
], function(Q, events, Vector2){
    function GameObject(VID, data){
        // VID = Virtuel ID
        this.VID = VID;
        this.id = data.id;
        this.position = this.parseVector2(data.position);
        this.size = data.size || 0;
        this.type = data.type || '';
        this.rotation = data.rotation ? data.rotation * (Math.PI/180): 0;
        this.hasDataChanged = false;
        this.hasClientDataChanged = false;
        this.lastClientDataChanged = 0;
        this.clientDifData = {};
    }
    
    GameObject.prototype.instanceType = 'GameObject';
    
    /**
     * the table name the data will be stored
     */
    GameObject.prototype.dbTable = '';
    /**
     * these properties are stored in the databse
     */
    GameObject.prototype.keysToSave = [
        'position',
        'type',
    ];
    
    /**
     * parse the vector string as JSON and returns a new Vec2
     * @param {String} vector - JSON String with X and Y keys
     * @returns {Vec2} vec2
     */
    GameObject.prototype.parseVector2 = function(vector){
        var vec;
        try{
            vec = JSON.parse(vector);
        }catch(e){
            vec = {
                x : 0,
                y : 0,
            };
            this.dataHasChanged();
        }
        return new Vector2(vec.x ||0, vec.y || 0);
    };
    /**
     * save the game object on the database
     */
    GameObject.prototype.saveData = function(mysqlPool){
        return Q.Promise((function(resolve, reject){
            var data = [];
            for (var i = 0; i < this.keysToSave.length; i++) {
                var key = this.keysToSave[i];
                var value = this[key];
                data.push(this.convertForStore(value));
            }
            
            mysqlPool.query('REPLACE INTO ?? (??) VALUES (?)', [this.dbTable, this.keysToSave, data], (function(error){
                if(error){
                    reject(error);
                }else{
                    resolve();
                }
            }).bind(this));
        }).bind(this))
        .then((function(){
            this.hasDataChanged = false;
        }).bind(this));
    };
    /**
     * Stringify Objects
     */
    GameObject.prototype.convertForStore = function(value){
        switch (typeof value) {
            case 'number':
            case 'string':
            case 'boolean':
                return value;
            case 'object':
                return JSON.stringify(value);
                
        }
    };
    /**
     * get the important startup data for the client
     * @returns {Object}
     */
    GameObject.prototype.getClientStartData = function(){
        var data = {
            VID : this.VID,
            instanceType : this.instanceType,
            type: this.type,
            position : {
                x : this.position.x,
                y : this.position.y,
            },
            rotation : this.rotation ? this.rotation : undefined,
        };
        return data;
    };
    
    /**
     * get the data that has changed since last frame
     */
    GameObject.prototype.getClientDifData = function(){
        return this.clientDifData;
    };
    
    /**
     *
     */
    GameObject.prototype.addClientChangedData = function(key, time){
        
        this.hasClientDataChanged = true;
        this.lastClientDataChanged = time;
        this.clientDifData[key] = this[key];
        this.dataHasChanged();
    };
    
    /**
     * this function will be executetd every frame
     */
    GameObject.prototype.update = function(time, deltaTime, village){
        
        if(time > this.lastClientDataChanged){
            this.hasClientDataChanged = false;
            this.clientDifData = {};
        }
    };
    
    GameObject.prototype.dataHasChanged = function(){
        this.hasDataChanged = true;
    }
    
    return GameObject;
});