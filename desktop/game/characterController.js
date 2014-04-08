define([
'./mouse',
'./keyboard', 
'./gamepad',
'three',
'desktop/utili/debug',
], function(Maus, Keyboard, Gamepad, THREE, debug){
    function CharacterController(){
        this.controller = Array.prototype.slice.call(arguments, 0);
        this.movementVelocity = new THREE.Vector2(0,0);
        this.cameraVelocity = new THREE.Vector2(0,0);
        this.debug = true;
    }
    
    var zeroVector2 = new THREE.Vector2(0, 0);
    
    CharacterController.prototype.update = function(){
        // update each controller
        this.controller.forEach(function(controller){
            controller.update();
        });
        
        // movment
        this.movementVelocity = this.controller.reduce(function(vector2, ctrl){
            var newVec2 = ctrl.movementVelocity;
            if(!newVec2.equals(zeroVector2)){
                return vector2.copy(newVec2);
            }
            return vector2;
        }, this.movementVelocity.set(0, 0));
        
        // camera
        this.cameraVelocity = this.controller.reduce(function(vector2, ctrl){
            var newVec2 = ctrl.cameraVelocity;
            if(!newVec2.equals(zeroVector2)){
                return vector2.copy(newVec2);
            }
            return vector2;
        }, this.cameraVelocity.set(0, 0));
        
        if(this.debug){
            //debug.log("Movment Velocity", "X:", this.movementVelocity.x.toFixed(2), "| Y:", this.movementVelocity.y.toFixed(2));
            //debug.log("Camera Velocity", "X:", this.cameraVelocity.x.toFixed(2), "| Y:", this.cameraVelocity.y.toFixed(2));
        }
        
    };
    
    return new CharacterController(Maus, Keyboard, Gamepad);
});