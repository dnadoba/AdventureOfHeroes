define([
'./controller',
'three',
'general/utili/mathHelper',
'desktop/utili/debug'
], function(Controller, THREE, MathHelper, debug){
    // Pointer Lock: http://www.html5rocks.com/en/tutorials/pointerlock/intro/
    var element = document.getElementById('gameCanvas');
    element.requestPointerLock = element.requestPointerLock ||
                                element.mozRequestPointerLock ||
                                element.webkitRequestPointerLock;
	document.exitPointerLock =  document.exitPointerLock ||
                                document.mozExitPointerLock ||
                                document.webkitExitPointerLock;
                                
    function Mouse(){
        Controller.call(this);
        this.aktive = false;
        this.cameraDamping = 10
        
        this.mouseMovement = new THREE.Vector2(0, 0);
        this.scrollDelta = 0;
        this.maxScrolleDelta = 50;
        this.scrollDump = 80;
        
        // pointer lock change events
        document.addEventListener('pointerlockchange', this.onpointerlockchange.bind(this), false);
        document.addEventListener('mozpointerlockchange', this.onpointerlockchange.bind(this), false);
        document.addEventListener('webkitpointerlockchange', this.onpointerlockchange.bind(this), false);
        
        document.addEventListener('pointerlockerror', this.onpointerlockchange.bind(this), false);
        document.addEventListener('mozpointerlockerror', this.onpointerlockchange.bind(this), false);
        document.addEventListener('webkitpointerlockerror', this.onpointerlockchange.bind(this), false);
        
        // mouse movement
        document.addEventListener('mousemove', this.onmousemove.bind(this), false);
        // mouse scroll
        document.addEventListener('mousewheel', this.onmousewheel.bind(this), false);
    }
    
    Mouse.prototype = Object.create(Controller.prototype);
    
    Mouse.prototype.update = function(){
        this.reset();
        
        // camera velocity
        this.cameraVelocity
        .copy(this.mouseMovement)
        // damping
        .divideScalar(this.cameraDamping)
        
        // mouse wheel
        this.cameraVelocity.y = this.scrollDelta;
        
        // reset
        this.mouseMovement.set(0, 0);
        this.scrollDelta = 0;
    };
    
    Mouse.prototype.lock = function(){
        element.requestPointerLock();
    };
    
    Mouse.prototype.unlock = function(){
        document.exitPointerLock();
    };
    
    Mouse.prototype.onpointerlockchange = function(e){
        if (document.pointerLockElement === element ||
            document.mozPointerLockElement === element ||
            document.webkitPointerLockElement === element){
            // pointer locked   
            this.aktive = true;
        }else{
            // pointer unloacked
            this.aktive = false;
        }
    };
    
    Mouse.prototype.onmousemove = function(e){
        if(!this.aktive){
            return;
        }
        var movement = {
            x : e.movementX || e.mozMovementX || e.webkitMovementX || 0,
            y : e.movementY || e.mozMovementY || e.webkitMovementY || 0,
        };
        this.mouseMovement.add(movement);
    };
    
    Mouse.prototype.onmousewheel = function(e){
        if(!this.aktive){
            return;
        }
        var delta = e.deltaY;
        this.scrollDelta = MathHelper.inRange(
            -this.maxScrolleDelta, 
            this.maxScrolleDelta, 
            this.scrollDelta + (delta / this.scrollDump) 
        );
    };
    
    return new Mouse();
});