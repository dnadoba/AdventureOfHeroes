if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'vendors/vector2',
'./GameObject',
], function(Q, events, Vector2, GameObject){
    function DynamicObject(VID, data){
        // call super constructor
        GameObject.call(this, VID, data);
        
        this.dead = false;
        
        this.killTime = 0;
        
        this.maxHealth = data.maxHealth || 0;
        this.healthRegeneration = data.healthRegeneration || 0;
        this.health = data.health || this.maxHealth;
        
        this.maxMana = data.maxMana || 0;
        this.manaRegeneration = data.manaRegeneration || 0;
        this.mana = data.mana || this.maxMana;
        
        this.speed = data.speed || 0;
        this.damage = data.damage || 0;
        this.armor = data.armor || 0;
        this.attackSpeed = data.attackSpeed || 0;
        this.attackRange = data.attackRange || 0;
        this.velocity = new Vector2(0,0);
        
        this.hits = [];
    }
    // inherits from GameObject
    DynamicObject.prototype = Object.create(GameObject.prototype);
    
    DynamicObject.prototype.instanceType = 'DynamicObject';
    
    DynamicObject.prototype.dbTable = '';
    
    DynamicObject.prototype.keysToSave = DynamicObject.prototype.keysToSave.concat([
        'healt',
        'maxHealth',
        'healthRegeneration',
        'mana',
        'maxMana',
        'manaRegeneration',
        'speed',
        'damage',
        'armor',
        'attackSpeed',
        'attackRange',
    ]);
    
    var zeroVec2 = new Vector2(0, 0);
    
    DynamicObject.prototype.update = function(time, deltaTime, village){
        GameObject.prototype.update.call(this, time, deltaTime, village);
        // add velocity
        this.computeVelocity(time, deltaTime, village);
        
        if(!this.dead &&
            this.health < this.maxHealth){
            
            this.regenerateHealth(deltaTime);
        }
        
        if(!this.dead &&
            this.mana < this.maxMana){
            
            this.regenerateMana(deltaTime);    
        }
    };
    
    DynamicObject.prototype.computeVelocity = function(time, deltaTime, village){
        if(!this.velocity.equals(zeroVec2)){
            var velocity = this.velocity.clone().multiplyScalar(deltaTime/1000);
            //console.log(this.position);
            this.position.add(velocity);
            this.addClientChangedData('position', time);
        }
    };
    
    DynamicObject.prototype.getClientStartData = function(){
        var data = GameObject.prototype.getClientStartData.call(this);
        
        data.dead = this.dead;
        
        data.health = this.health;
        //data.healthRegneration = this.healthRegneration;
        data.maxHealth = this.maxHealth;
        
        data.mana = this.mana;
        //data.manaRegeneration = this.manaRegeneration;
        data.maxMana = this.maxMana;
        
        data.speed = this.speed;
        
        //data.damage = this.damage;
        //data.armor = this.armor;
        
        data.attackSpeed = this.attackSpeed;
        data.velocity = this.velocity;
        return data;
    };
    
    DynamicObject.prototype.regenerateHealth = function(deltaTime){
        this.health += this.healthRegeneration * deltaTime;
        if(this.health > this.maxHealth){
            this.health = this.maxHealth;
        }
        this.addClientChangedData('health');
    };
    
    DynamicObject.prototype.regenerateMana = function(deltaTime){
        this.mana += this.manaRegeneration * deltaTime;
        if(this.mana > this.maxMana){
            this.mana = this.maxMana;
        }
        this.addClientChangedData('mana');
    };
    
    /**
     * attack a DynamicObject if its posible
     * @returns {Object} result - Object with keys damage {Number} and killed{Boolean}
     */
    
    DynamicObject.prototype.attack = function(target, time){
        var takenDamage = 0;
        
        // distance to the target
        var dist = target.position.dist(this.position);
        
        // is target in attack range
        if(dist <= this.attackRange){
            takenDamage = target.takeDamage(this.damage, this, time);
        }

        return {
            takenDamage : takenDamage,
            // if takenDamage <= 0 maybe the target was dead
            killed : takenDamage > 0 ? target.dead : false,
        };
    };
    
    /**
     * @param {Number} damage
     * @param {DynamicObject} source
     * @param {Number} time
     * @returns {Number} realDamage
     */
    
    DynamicObject.prototype.takeDamage = function(damage, source, time){
        if(this.dead){
            return 0;
        }
        damage -= this.armor;
        this.health -= damage;
        if(this.health){
            this.kill(source, time);
        }
        this.addClientChangedData('health');
        return damage;
    };
    
    DynamicObject.prototype.kill = function(source, time){
        this.health = 0;
        this.dead = true;
        this.killTime = time;
        this.addClientChangedData('dead');
    };
    
    return DynamicObject;
});