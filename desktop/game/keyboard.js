define([
'./controller',
'three',
], function(Controller, THREE){
    
    var KEYS = {
        W : 87,
        A : 65,
        S : 83,
        D : 68,
        UP : 38,
        LEFT : 37,
        DOWN : 40,
        RIGHT : 39,
    }
    
    function Keyboard(){
        Controller.call(this);
        document.addEventListener('keydown', this.onkeydown.bind(this), false);
        document.addEventListener('keyup', this.onkeyup.bind(this), false);
        this.keyDowns = {};
        // short version for is key down
        this.k = this.isKeyDown.bind(this)
    }
    Keyboard.prototype = Object.create(Controller.prototype);
    
    Keyboard.prototype.onkeydown = function(e){
        var keyCode = e.keyCode;
        this.keyDown(keyCode);
    }
    
    Keyboard.prototype.onkeyup = function(e){
        var keyCode = e.keyCode;
        this.keyUp(keyCode);
    }
    
    Keyboard.prototype.keyDown = function(keyCode){
        this.keyDowns[keyCode] = true;
    }
    
    Keyboard.prototype.keyUp = function(keyCode){
        this.keyDowns[keyCode] = false;
    }
    
    Keyboard.prototype.isKeyDown = function(key){
        return !!this.keyDowns[key];
    }
    
    Keyboard.prototype.update = function(){
        this.reset();
        var K = KEYS;
        // short version of is key down
        var k = this.k;
        
        // move forward
        if (k(K.W) || 
            k(K.UP)){
                
            this.movementVelocity.y = 1;
        
        // move backward
        }else 
        if( k(K.S) ||
            k(K.DOWN)){
            
            this.movementVelocity.y = -1;
                
        }
        
        // move right
        if (k(K.D) || 
            k(K.RIGHT)){
            
            this.movementVelocity.x = -1;
        
        // move left   
        }else
        if (k(K.A) ||
            k(K.LEFT)){
            
            this.movementVelocity.x = 1;
                
        }
        
        this.movementVelocity.normalize();
        
    }
    
    return new Keyboard();
});