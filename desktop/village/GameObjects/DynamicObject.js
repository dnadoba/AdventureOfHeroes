define([
'configs/client',
'./GameObject',
'three',
'desktop/utili/debug',
'box2d',
'general/utili/MathHelper'
], function(config, GameObject, THREE, debug, b2, MathHelper){
    function DynamicObject(){
        GameObject.call(this);
        
        this.dead = false;
        this.health = 0;
        this.maxHealth = 0;
        this.mana = 0;
        this.maxMana = 0;
        this.attackSpeed = 0;
        this.speed = 3;
        this.velocity = new THREE.Vector2(0, 0);
        this.destRotation = 0;
        this.rotationSpeed = THREE.Math.degToRad(650) / 1000;
        this.realPosition = new THREE.Vector2(0, 0);
    }
    DynamicObject.prototype = Object.create(GameObject.prototype);
    
    var zeroVector2 = new THREE.Vector2(0,0);
    
    DynamicObject.prototype.update = function(time, deltaTime, village){
        GameObject.prototype.update.apply(this, arguments);
        
        this.updatePosition(time, deltaTime, village);
        
        this.updateRotation(time, deltaTime, village);
        this.updateHeight(time, deltaTime, village);
        
    };
    
    DynamicObject.prototype.updatePosition = function(time, deltaTime, village){
        // calc new position
        this.realPosition.add(this.velocity.clone().multiplyScalar(deltaTime/1000));
        

        debug.logValue("real position", this.realPosition, true);
        if(this.body){
            
            var newPos = this.body.GetTransform().p;
            this.setPosition(newPos.x, newPos.y);
            
            
            var distance = this.position.distanceTo(this.realPosition);
            var maxDistance = this.speed * 2;
            if(distance > maxDistance){
                // "warp" to real position
                

                
                this.setPosition(this.realPosition.x, this.realPosition.y);
            }
            
            //velocity
            //var velocity = this.velocity.clone().multiplyScalar(this.speed * deltaTime);
            var velocity = this.realPosition.clone()
            .sub(this.position);

            
            var length = velocity.length();
            
            
            var maxAcceleration = Math.max(1, (distance/maxDistance) * (this.speed));
            

            
            //limit speed
            var speed = Math.min(length * deltaTime, maxAcceleration) / deltaTime;//Math.min(maxSpeed, length);
            
            velocity
            .normalize()
            .multiplyScalar(speed);
            

            
            velocity.multiplyScalar(this.speed * deltaTime);
            
            if(!velocity.equals(zeroVector2)){

                
                //this.body.SetAwake(true);
                this.body.SetLinearVelocity(new b2.Vec2(velocity.x, velocity.y), this.body.GetWorldCenter());
                
            }
            
        }
    };
    
    DynamicObject.prototype.updateRotation = function(time, deltaTime, village){
        var crtRotation = this.getRotation();
        if(crtRotation !== this.destRotation){
            crtRotation = MathHelper.rotateToDestDamped(crtRotation, this.destRotation, this.rotationSpeed * deltaTime, 5);
            
            this.setRotation(crtRotation);
        }
    };
    
    //apply start package
    DynamicObject.prototype.onStartData = function(package){
        GameObject.prototype.onStartData.call(this, package);
        
        if(package.position){
            this.realPosition.copy(package.position);
        }
        
        if(package.rotation){
            this.destRotation = package.rotation;
        }
        
        if(package.velocity){
            this.velocity.copy(package.velocity);
        }
        
        if(package.speed){
            this.speed = package.speed;
            if(config.speedHack){
                this.speed *= 2;
            }
        }
        
        if(package.health){
            this.health = package.health;
        }
        
        if(package.maxHealth){
            this.maxHealth = package.maxHealth;
        }
        
        if(package.mana){
            this.mana = package.mana;
        }
        
        if(package.maxMana){
            this.maxMana = package.maxMana;
        }
        
        if(package.attackSpeed){
            this.attackSpeed = package.attackSpeed;
        }
        
        if(package.dead){
            this.dead = package.dead;
        }
    };
    
    // apply dif package
    DynamicObject.prototype.onDifData = function(package){
        if(package.position){
            this.realPosition.copy(package.position);
            package.position = undefined;
        }
        
        if(package.rotation){
            this.destRotation = package.rotation;
            package.rotation = undefined;
        }
        
        GameObject.prototype.onDifData.call(this, package);
        
        if(package.velocity){
            this.velocity.copy(package.velocity);
        }
        
        if(package.speed){
            this.speed = package.speed;
        }
        
        if(package.health){
            this.health = package.health;
            if(config.speedHack){
                this.speed *= 2;
            }
        }
        
        if(package.maxHealth){
            this.maxHealth = package.maxHealth;
        }
        
        if(package.mana){
            this.mana = package.mana;
        }
        
        if(package.maxMana){
            this.maxMana = package.maxMana;
        }
        
        if(package.attackSpeed){
            this.attackSpeed = package.attackSpeed;
        }
        
        if(package.dead){
            this.dead = package.dead;
        }
    };
    
    
    
    return DynamicObject;
});