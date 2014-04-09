define([
'box2d',
'three',
'desktop/utili/debug',
], function(b2, THREE, debug){
    function GameObject(){
        this.VID = 0;
        this.model = false;
        this.heightCollider = false;
        this.bodyDef = false;
        this.body = false;
        this.position = new THREE.Vector2(0, 0);
    }
    
    GameObject.prototype.createBody = function(world){
        if(this.bodyDef){
            console.log(this.bodyDef);
            this.body = b2.RUBELoader.parseBody(this.bodyDef, world);
            this.body.SetTransform(this.position, this.getRotation());
            return this.body;
        }else{
            return false;
        }
    };
    
    GameObject.prototype.setPosition = function(x, y){
        if(typeof x !== 'number' || typeof y !== 'number'){
            throw new Error("NaN");
        }
        this.position.set(x, y);
        if(this.model){
            this.model.position.x = x;
            this.model.position.z = y;
        }
        if(this.heightCollider){
            this.heightCollider.position.x = x;
            this.heightCollider.position.z = y;
            // heightCollider is not in the scene, the matrix must be updated manually
            this.heightCollider.updateMatrixWorld(true);
        }
        if(this.body){
            this.body.SetTransform(
                this.position, 
                this.body.GetAngle()
            );
        }
    };
    
    GameObject.prototype.getPosition = function(){
        console.warn("GameObject.getPosition() is deprecated");
        return this.position.clone();
    };
    
    GameObject.prototype.setRotation = function(rotation){
        if(this.model){
            this.model.rotation.y = rotation;
        }
        if(this.body){
            this.body.SetTransform(
                this.body.GetPosition(),
                -rotation
            );
        }
    };
    
    GameObject.prototype.getRotation = function(){
        if(this.model){
            return this.model.rotation.y;
        }else{
            return 0;
        }
    };
    
    GameObject.prototype.setHeight = function(height){
        if(this.model){
            this.model.position.y = height;
        }
    };
    
    GameObject.prototype.getHeight = function(){
        var height = 0;
        if(this.model){
            height = this.model.position.y;
        }
        return height;
    };
    
    GameObject.prototype.getIntersectHeight = (function(){
        var raycaster = new THREE.Raycaster(
            new THREE.Vector3(0, 50, 0), 
            new THREE.Vector3(0,-1,0)
        );
        return function(objects){
            var pos = this.position;
            raycaster.ray.origin.x = pos.x;
            raycaster.ray.origin.z = pos.y;
            var intersects = raycaster.intersectObjects(objects);
            if(intersects.length > 0){
                var intersect = intersects[0];
                // collision with itself
                if(intersect.object === this.heightCollider){
                    if(intersects.length > 1){
                        var realIntersect = intersects[1];
                        return realIntersect.point.y;
                    }else{
                        return false;
                    }
                }else{
                    return intersect.point.y;
                }
            }else{
                return false;
            }
        };
    })();
    
    GameObject.prototype.updateHeight = function(time, deltaTime, village){
        var newHeight = this.getIntersectHeight(village.heightCollider);

        this.setHeight(newHeight || 0);
    }
    
    GameObject.prototype.onStartData = function(package){
        if(package.position){
            this.setPosition(package.position.x, package.position.y);
        }
        if(package.rotation){
            this.setRotation(package.rotation);
        }
    };
    
    GameObject.prototype.onDifData = function(data, delteTime, ping){
        if(data.position){
            this.setPosition(data.position.x, data.position.y);
        }
    };
    
    GameObject.prototype.dispose = function(){
        this.removeBody();
    };
    
    GameObject.prototype.removeBody = function(){
        if(this.body){
            this.body.GetWorld().DestroyBody(this.body);
            this.body = false;
        }
    };
    
    GameObject.prototype.update = function(time, deltaTime){
        
    };
    
    GameObject.prototype.animate = function(time, deltaTime){
        
    };
    
    return GameObject;
    
});