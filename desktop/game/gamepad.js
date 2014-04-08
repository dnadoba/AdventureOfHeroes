define([
'./controller',
'three',
], function(Controller, THREE){
    var BUTTONS = {
        FACE_1: 0, // Face (main) buttons
        FACE_2: 1,
        FACE_3: 2,
        FACE_4: 3,
        LEFT_SHOULDER: 4, // Top shoulder buttons
        RIGHT_SHOULDER: 5,
        LEFT_SHOULDER_BOTTOM: 6, // Bottom shoulder buttons
        RIGHT_SHOULDER_BOTTOM: 7,
        SELECT: 8,
        START: 9,
        LEFT_ANALOGUE_STICK: 10, // Analogue sticks (if depressible)
        RIGHT_ANALOGUE_STICK: 11,
        PAD_TOP: 12, // Directional (discrete) pad
        PAD_BOTTOM: 13,
        PAD_LEFT: 14,
        PAD_RIGHT: 15
    };
    
    var AXES = {
        LEFT_ANALOGUE_HOR: 0,
        LEFT_ANALOGUE_VERT: 1,
        RIGHT_ANALOGUE_HOR: 2,
        RIGHT_ANALOGUE_VERT: 3
    };
    
    function Gamepad(){
        Controller.call(this);
        this.axisTreshhold = 0.1;
        this.normAxisTreshhold = 1 / (1 - (this.axisTreshhold * 2));
        this.buttonTreshhold = 0.25;
        this.normButtonTreshhold = 1 / (1 - (this.buttonTreshhold * 2));
        this.gamepad = false;
        
        this.cameraSensitiv = 2;
    }
    
    Gamepad.prototype = Object.create(Controller.prototype);
    
    Gamepad.prototype.getAxis = function(axis){
        var value = this.gamepad.axes[axis];
        
        return this.normalize(value, this.axisTreshhold, this.normAxisTreshhold);
    };
    
    Gamepad.prototype.normalize = function(value, treshhold, normTreshhold){
        var valuePos = value >= 0;
        if(Math.abs(value) <= treshhold){
            return 0;
        }
        
        if((Math.abs(value) + treshhold) >= 1){
            return valuePos ? 1 : -1;
        }
        
        if(valuePos){
            value -= treshhold;
        }else{
            value += treshhold;
        }
        value *= normTreshhold;
        
        return value;
    };
    
    Gamepad.prototype.getButtonAxis = function(button){
        var value = this.gamepad.buttons[button];
        
        return this.normalize(value, this.axisTreshhold, this.normAxisTreshhold);
    };
    
    Gamepad.prototype.getButton = function(button){
        var value = this.gamepad.buttons[button];
        
        return this.normalize(value, this.buttonTreshhold, this.normButtonTreshhold);
    };
    
    Gamepad.prototype.isButtonPressed = function(button){
        var value = this.gamepad.buttons[button];
        return value >= 0.5;
    };
    
    Gamepad.prototype.update = function(){
        this.reset();
        this.gamepad = navigator.webkitGetGamepads && navigator.webkitGetGamepads()[0];
        if(this.gamepad){
            this.movementVelocity.x = this.getAxis(AXES.LEFT_ANALOGUE_HOR) * -1;
            this.movementVelocity.y = this.getAxis(AXES.LEFT_ANALOGUE_VERT) * -1;
            
            this.cameraVelocity.x = this.getAxis(AXES.RIGHT_ANALOGUE_HOR) * this.cameraSensitiv;
            this.cameraVelocity.y = this.getAxis(AXES.RIGHT_ANALOGUE_VERT) * this.cameraSensitiv;
        }
    };
    
    return new Gamepad();
});