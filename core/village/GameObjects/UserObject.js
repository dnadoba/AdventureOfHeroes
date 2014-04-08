if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'vendors/vector2',
'./DynamicObject',
'performance-now',
], function(Q, events, Vector2, DynamicObject, now){

    function UserObject(VID, data, socket){
        // call super constructor
        DynamicObject.call(this, VID, data);
        
        // revive time in milliseconds
        this.reviveTime = 1000 * 10;
        
        this.name = data.name || '';
        this.ping = 0;
        this.socket = socket;
        this.viewRange = 320;
        this.lastSend = 0;
        this.lastReceive = 0;
        this.hasDifDataPackage = false;
        this.addDataPackage = [];
        this.difDataPackage = {};
        this.removeDataPackage = [];
        this.loaded = false;
        this.type = 'heros/default';
        this.destPosition = this.position.clone();
        this.destRotation = 0;
        this.rotation = 0;
        this.realVelcity = new Vector2(0, 0);
        socket.once('loaded', (function(){
            this.loaded = true;
        }).bind(this));
        socket.on('serverPingPackage', this.onServerPingPackage.bind(this));
        socket.on('serverUpdatePackage', this.onServerUpdatePackage.bind(this));
        
    }
    // inherits from DynamicObject
    UserObject.prototype = Object.create(DynamicObject.prototype);
    
    UserObject.prototype.instanceType = 'UserObject';
    
    UserObject.prototype.dbTable = 'user';
    
    UserObject.prototype.keysToSave = DynamicObject.prototype.keysToSave.concat([
        
    ]);
    
    UserObject.prototype.update = function(time, deltaTime, village){
        DynamicObject.prototype.update.call(this, time, deltaTime, village);
        
        if (this.dead && 
           (this.killTime + this.reviveTime) < time){
            
            this.revive();
        }
        
        if (this.rotation !== this.destRotation){
            this.rotation = this.destRotation;
            this.addClientChangedData('rotation', time);
        }
    };
    
    UserObject.prototype.lateUpdate = function(time, delteTime, village){
        
        
        // get and merg all changes
        
        village.addedLastFrame.forEach(function(gameObject){
            if(gameObject.VID !== this.VID){
                this.addDataPackage.push(gameObject.getClientStartData());
            }
        }, this);
        
        village.removedLastFrame.forEach(function(gameObject){
            this.removeDataPackage.push(gameObject.VID);
        }, this);
        
        var difData = this.getAllDifData(village);
        this.mergDifPackage(difData);
        
        var nextTimeSendUpdatePackage = this.lastSend + this.ping;
        if (this.loaded && nextTimeSendUpdatePackage < time){
            this.sendUpdatePackage(time, delteTime, village);
            this.lastSend = time;
        }
    };
    
    UserObject.prototype.disconnect = function(){
        this.socket.disconnect();
    };
    
    UserObject.prototype.onServerUpdatePackage = function(package){
        if (package.velocity &&
            typeof package.velocity.x === "number" &&
            typeof package.velocity.y === "number"){
            
            if(!this.realVelcity.equals(package.velocity)){
                
                var length = this.realVelcity.copy(package.velocity).length();
                
                length = Math.min(length, this.speed);
                
                this.realVelcity.normalize().multiplyScalar(length);
            }
        }
        
        if (package.position &&
            typeof package.position.x === "number" &&
            typeof package.position.y === "number"){
            
            this.destPosition.copy(package.position);
            
        }
        
        if (typeof package.destRotation === 'number'){
            this.destRotation = package.destRotation;
        }
        
        this.lastReceive = now();
    };
    
    UserObject.prototype.onServerPingPackage = function(serverTime){
        this.ping = this.calcPing(serverTime);
    };
    
    var zeroVector2 = new Vector2(0, 0);
    
    UserObject.prototype.computeVelocity = function(time, deltaTime, village){
        if(!this.realVelcity.equals(zeroVector2)){
            var realVelcity = this.realVelcity.clone().multiplyScalar(deltaTime/1000);
            this.destPosition.add(realVelcity);
            this.realVelcity.set(0,0);
        }
        
        
        //calc velocity
        if(!this.position.equals(this.destPosition)){
            
            var distance = this.position.distanceTo(this.destPosition);
            var maxDistance = this.speed * 2;
            if(distance > maxDistance){
                this.resetPosition()
            }
            
            this.velocity = this.destPosition.clone()
            .sub(this.position);
            
            console.log("vector", this.velocity)
            
            var length = this.velocity.length();
            
            console.log("length", length);
            
            var speed = Math.min(length*deltaTime, this.speed);
            console.log("speed", speed);
            this.velocity
            .normalize()
            .multiplyScalar(speed)
            
            console.log("velocity", this.velocity);
            
            this.addClientChangedData('velocity', time);
        }else{
            if(!this.velocity.equals(zeroVector2)){
                this.velocity.set(0, 0);
                this.addClientChangedData('velocity', time);
            }
        }
        
        DynamicObject.prototype.computeVelocity.apply(this, arguments);
    }
    
    UserObject.prototype.resetPosition = function(){
        console.log("reset");
        this.destPosition.copy(this.position);
        //TO DO
        // send client that his position was reset
    }
    
    UserObject.prototype.getClientStartData = function(){
        var data = DynamicObject.prototype.getClientStartData.call(this);
        data.rotation = this.rotation;
        
        return data;
    }
    
    UserObject.prototype.calcPing = function(clientServerTime){
        var ping = ((now() - clientServerTime) / 2);
        if(ping < 0){
            ping = 0;
        }else if(ping > 1000){
            ping = 1000;
        }
        return ping;
    }
    
    UserObject.prototype.sendUpdatePackage = function(time, delteTime, village){
        this.socket.emit('updatePackage', this.getUpdatePackage(time, delteTime, village));
    };
    
    UserObject.prototype.sendStartPackage = function(time, delteTime, village){
        this.socket.emit('startPackage', this.getStartPackage(time, delteTime, village));
    };
    
    UserObject.prototype.getStartPackage = function(time, delteTime, village){
        var data = {
            time : time,
            userVID : this.VID,
            add : this.getAllStartData(village),
        };
        return data;
    };
    
    UserObject.prototype.getUpdatePackage = function(time, deltaTime, village){
        var data = {
            ping : this.ping.toFixed(1),
            time : time,
            deltaTime : ((time - this.lastSend) - deltaTime).toFixed(1),
            dif : this.hasDifDataPackage ? this.difDataPackage : undefined,
            add : this.addDataPackage.length ? this.addDataPackage : undefined,
            remove : this.removeDataPackage.length ? this.removeDataPackage : undefined,
        };
        this.hasDifDataPackage = false;
        this.addDataPackage = [];
        this.difDataPackage = {};
        this.removeDataPackage = [];
        return data;
    };
    
    UserObject.prototype.getAllStartData = function(village){
        var data = [];
        village.forEach(function(object){
            var objData = object.getClientStartData();
            if(object === this){
                objData.instanceType = 'PlayerObject'
            }
            data.push(objData);
        }, this);
        return data;
    };
    
    UserObject.prototype.getAllDifData = function(village){
        var data = {};
        village.forEach(function(object){

            if(object.hasClientDataChanged){
                
                var objData = object.getClientDifData();
                if(object === this){
                    
                    
                }
                data[object.VID] = objData;
            }
        }, this);
        return data;
    };
    
    UserObject.prototype.mergDifPackage = function(newData){
        if(!this.hasDifDataPackage){
            this.difDataPackage = newData;
            this.hasDifDataPackage = true;
        }else{
            for(var VID in newData){
                var newPackage = newData[VID];
                var oldPackage = this.difDataPackage[VID];
                if(oldPackage === undefined){
                    this.difDataPackage[VID] = newPackage;
                }else{
                    for(var key in newPackage){
                        oldPackage[key] = newPackage[key];
                    }
                }
            }
        }
    };
    
    /**
     * tests if object is in the view range
     * @param {GameObject} object
     * @returns {Boolean} inViewRange
     */
    
    UserObject.prototype.inViewRange = function(object){
        var dist = object.position.dist(this.position);
        return dist <= this.viewRange;
    };
    
    UserObject.prototype.revive = function(){
        this.dead = false;
        this.health = this.maxHealth;
        
        
        this.addClientChangedData('health');
        this.addClientChangedData('dead');
    };
    
    
    return UserObject;
});