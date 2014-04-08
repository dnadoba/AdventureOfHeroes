define([
'three',    
], function(THREE){
    function Controller(){
        this.aktive = true;
        this.movementVelocity = new THREE.Vector2(0, 0);
        this.cameraVelocity = new THREE.Vector2(0, 0);
    }
    
    //abstrakt
    Controller.prototype.update = function(){
        
    };
    
    Controller.prototype.reset = function(){
        this.movementVelocity.set(0, 0);
        this.cameraVelocity.set(0, 0);
    };
    
    return Controller;
})