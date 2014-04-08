define([
'./GameObject',
'./UserObject',
'three',
'box2d',
'desktop/utili/debug',
], function(GameObject, UserObject, THREE, b2, debug){
    function PlayerObject(){
        UserObject.call(this);
    }
    
    PlayerObject.prototype = Object.create(UserObject.prototype);
    
    PlayerObject.prototype.update = function(time, deltaTime, village){
        UserObject.prototype.update.apply(this, arguments);
        
    };
    
    var zeroVector2 = new THREE.Vector2(0, 0);
    
    PlayerObject.prototype.updatePosition = function(time, deltaTime, village){
        
        if(this.body){
            
            var newPos = this.body.GetTransform().p;
            this.setPosition(newPos.x, newPos.y);
            
            //velocity
            var velocity = this.velocity.clone().multiplyScalar(this.speed * deltaTime);
            
            
            
            if(velocity.equals(zeroVector2)){
                this.body.SetLinearDamping((this.speed/3) * deltaTime);
            }else{
                this.body.SetAwake(true);
                this.body.ApplyForce(new b2.Vec2(velocity.x, velocity.y), this.body.GetWorldCenter());
                this.body.SetLinearDamping(this.speed * deltaTime);
            }
            
            
        }
    };
    
    PlayerObject.prototype.updateVelocity = function(time, deltaTime, village, characterController){
        var cameraRotation = -village.cameraContainer.rotation.y;
        
        var velocity = characterController.movementVelocity.clone();
        var length = velocity.length();
        velocity.normalize();
        
        var cs = Math.cos(cameraRotation);
        var sn = Math.sin(cameraRotation);
        
        velocity.set(
            velocity.x * cs - velocity.y * sn,
            velocity.x * sn + velocity.y * cs
        )
        .normalize()
        .multiplyScalar(Math.min(length, 1));
        
        
        this.velocity.copy(velocity).multiplyScalar(this.speed);
        
        if(!characterController.movementVelocity.equals(zeroVector2)){
            var rotation = Math.atan2(velocity.x, velocity.y);
            
            this.destRotation = rotation;
            
        }else{
            //this.destRotation = this.getRotation();
        }
    };
    
    PlayerObject.prototype.onDifData = function(package){
        
    };
    
    return PlayerObject;
});