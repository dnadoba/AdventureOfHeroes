define([
'three',
'desktop/utili/debug',
], function(THREE, debug){
    var PI2 = Math.PI*2;
    var CLOCKWISE = 1;
    var COUNTER_CLOCKWISE = -1;
    
    function inRange(min, max, value){
        
        return Math.min(max, Math.max(min, value));
    }
    
    function convertAngle(angle){
        return Math.atan2(Math.sin(angle), Math.cos(angle));
    }

    
    function dampValue(value, damp){
        return value / damp;
    }
    
    function determineSmallestAngle(crtAngle, destAngle)
    {
        
        destAngle -= Math.floor(destAngle / PI2) * PI2;
        
        if(destAngle > Math.PI) destAngle -= PI2;
        
        destAngle -= crtAngle;
        
        if (destAngle > Math.PI) destAngle -= PI2;
        if (destAngle < -1 * Math.PI) destAngle += PI2;
        
        return (destAngle > 0) ? CLOCKWISE : COUNTER_CLOCKWISE;
    }
    
    function distanceBetweenAngles(crtAngle, destAngle){
        return -Math.atan2(
            Math.sin(crtAngle - destAngle), 
            Math.cos(crtAngle - destAngle)
        );
    }

    /**
     * @param {Number} crtAngle - current angle (direction) of entity
     * @param {Number} destAngle - angle entity SHOULD be at
     * @param {Number} angInc - how much we should turn each frame (adjusts speed of animation)
     * @returns {Number} angle
     */
    function rotateToDest(crtAngle, destAngle, angleInc){
        
        var smallestAngle = determineSmallestAngle(crtAngle, destAngle);
        
        var newAngle = crtAngle + (angleInc * smallestAngle);
        
        var checkSmallestAngle = determineSmallestAngle(newAngle, destAngle);
        
        if(smallestAngle !== checkSmallestAngle){
            newAngle = destAngle;
        }
        
        return newAngle;
    }
    
    function rotateToDestDamped(crtAngle, destAngle, angleInc, damp){
        
        var addAngle = dampValue(distanceBetweenAngles(crtAngle, destAngle), damp);
        
        if(Math.abs(addAngle) > angleInc){
            var smallestAngle = determineSmallestAngle(crtAngle, destAngle);
            addAngle = angleInc * smallestAngle;
        }
        var newAngle = crtAngle + addAngle
        
        return convertAngle(newAngle);
        
    }
    
    return {
        convertAngle : convertAngle,
        rotateToDest : rotateToDest,
        rotateToDestDamped : rotateToDestDamped,
        determineSmallestAngle : determineSmallestAngle,
        inRange : inRange,
    };
});