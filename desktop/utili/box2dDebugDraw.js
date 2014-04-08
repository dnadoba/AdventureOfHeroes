define([
'box2d',
], function(b2){
    function CanvasDebugDraw(ctx)
    {
        b2.Draw.call(this);
        this.context = ctx;
        this.scale = 1;
    }

    CanvasDebugDraw.prototype = Object.create(b2.Draw.prototype);
    

    CanvasDebugDraw.prototype.DrawPolygon = function(vertices, vertexCount, color)
    {
        this.context.strokeStyle = this.ColorFor(color, 1.0);
        this.context.beginPath();
        this.context.moveTo(vertices[0].x, vertices[0].y);

        for (var i = 1; i < vertexCount; ++i)
            this.context.lineTo(vertices[i].x, vertices[i].y);

        this.context.closePath();
        this.context.stroke();
    };

    CanvasDebugDraw.prototype.DrawSolidPolygon = function(vertices, vertexCount, color)
    {
        this.context.fillStyle = this.ColorFor(new b2.Color(color.r * 0.5, color.g * 0.5, color.b * 0.5)    , 0.5);
        this.context.strokeStyle = this.ColorFor(color, 1.0);
        this.context.beginPath();
        this.context.moveTo(vertices[0].x, vertices[0].y);

        for (var i = 1; i < vertexCount; ++i)
            this.context.lineTo(vertices[i].x, vertices[i].y);

        this.context.closePath();
        this.context.stroke();
        this.context.fill();
    };

    CanvasDebugDraw.prototype.DrawCircle = function(center, radius, color)
    {
        this.context.strokeStyle = this.ColorFor(color, 1.0);
        this.context.beginPath();
        this.context.arc(center.x, center.y, radius, 0, Math.PI * 2);
        this.context.closePath();
        this.context.stroke();
    };

    CanvasDebugDraw.prototype.DrawSolidCircle = function(center, radius, axis, color)
    {
        this.context.fillStyle = this.ColorFor(new b2.Color(color.r * 0.5, color.g * 0.5, color.b * 0.5), 0.5);
        this.context.strokeStyle = this.ColorFor(color, 1.0);
        this.context.beginPath();
        this.context.arc(center.x, center.y, radius, 0, Math.PI * 2);
        if (axis)
        {
            this.context.moveTo(center.x, center.y);
            var p = b2.Vec2.Add(center, b2.Vec2.Multiply(radius, axis));
            this.context.lineTo(p.x, p.y);
        }
        this.context.closePath();
        this.context.stroke();
        this.context.fill();
    };

    CanvasDebugDraw.prototype.DrawSegment = function(p1, p2, color)
    {
        this.context.strokeStyle = this.ColorFor(color, 1.0);
        this.context.beginPath();
        this.context.moveTo(p1.x, p1.y);
        this.context.lineTo(p2.x, p2.y);
        this.context.closePath();
        this.context.stroke();
    };

    CanvasDebugDraw.prototype.DrawTransform = function(xf)
    {
        var k_axisScale = 0.4;
        var p1 = xf.p, p2;

        this.context.strokeStyle = this.ColorFor(new b2.Color(1, 0, 0), 1.0);
        this.context.beginPath();
        this.context.moveTo(p1.x, p1.y);
        p2 = b2.Vec2.Add(p1, b2.Vec2.Multiply(k_axisScale, xf.q.GetXAxis()));
        this.context.lineTo(p2.x, p2.y);
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = this.ColorFor(new b2.Color(0, 1, 0), 1.0);
        this.context.beginPath();
        this.context.moveTo(p1.x, p1.y);
        p2 = b2.Vec2.Add(p1, b2.Vec2.Multiply(k_axisScale, xf.q.GetYAxis()));
        this.context.lineTo(p2.x, p2.y);
        this.context.closePath();
        this.context.stroke();
    };

    CanvasDebugDraw.prototype.DrawPoint = function(p, size, color)
    {
        size = size / this.scale;
        var hs = size / 2;
        this.context.fillStyle = this.ColorFor(color, 1.0);
        this.context.fillRect(p.x - hs, p.y - hs, size, size);
    };

    CanvasDebugDraw.prototype.DrawAABB = function(aabb, c)
    {
        this.context.fillStyle = this.ColorFor(c, 1.0);
        this.context.rect(aabb.lowerBound.x, aabb.lowerBound.y, aabb.upperBound.x - aabb.lowerBound.x, aabb.upperBound.y - aabb.lowerBound.y);
        this.context.stroke();
    };

    CanvasDebugDraw.prototype.ColorFor = function(c, a)
    {
        var r = Math.floor(c.r * 255);
        var g = Math.floor(c.g * 255);
        var b = Math.floor(c.b * 255);

        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    };

    CanvasDebugDraw.prototype.DrawParticles = function(centers, radius, colors, count)
    {
        this.context.fillStyle = 'rgba(255, 255, 255, 0.25)';
        for (var i = 0; i < count; ++i)
        {
            if (colors && colors[i])
                this.context.fillStyle = 'rgba(' + colors[i].r + ', ' + colors[i].g + ', ' + colors[i].b + ', ' + (colors[i].a / 255) + ')';
            this.context.beginPath();
            this.context.rect(centers[i].x - radius, centers[i].y - radius, radius * 2, radius * 2);
            this.context.closePath();
            this.context.fill();
        }
    };
    
    
    
    
    function Box2dDebugDraw(world){
        var id = 'box2dDebugDraw';
        this.canvas = document.getElementById(id);
        if(!this.canvas){
            this.canvas = document.createElement('canvas');
            this.canvas.id = id;
            document.body.appendChild(this.canvas);
        }
        
        this.debugDraw = new CanvasDebugDraw(this.canvas.getContext('2d'));
        this.debugDraw.SetFlags(b2.Draw.e_shapeBit | b2.Draw.e_jointBit);
        this.world = world;
        world.SetDebugDraw(this.debugDraw);
        
        this.center = new b2.Vec2(0,0);
        this.scale = 14;
        
        this.onresize();
        window.addEventListener('resize', this.onresize.bind(this), false);
        this.canvas.addEventListener('mousedown', this.onmousedown.bind(this), false);
        this.canvas.addEventListener('mouseup', this.onmouseup.bind(this), false);
        this.canvas.addEventListener('mousemove', this.onmousemove.bind(this), false);
        this.canvas.addEventListener('mousewheel', this.onmousewheel.bind(this), false);
        
        this.mouseDown = false;
    }
    
    Box2dDebugDraw.prototype.draw = function(){
        this.debugDraw.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.debugDraw.context.save();
        this.debugDraw.context.translate((this.debugDraw.context.canvas.width / 2), this.debugDraw.context.canvas.height / 2);
		
		this.debugDraw.context.scale(this.scale, this.scale);
		this.debugDraw.context.translate(-this.center.x, -this.center.y);
		this.debugDraw.context.lineWidth = 1 / this.scale;
		this.world.DrawDebugData();
		this.debugDraw.context.restore();
    }
    
    Box2dDebugDraw.prototype.onresize = function(){
        this.canvas.width = window.innerWidth/3;
        this.canvas.height = window.innerHeight/2;
    };
    
    Box2dDebugDraw.prototype.onmousedown = function(){
        this.mouseDown = true;
    };
    
    Box2dDebugDraw.prototype.onmouseup = function(){
        this.mouseDown = false;
    };
    
    Box2dDebugDraw.prototype.onmousemove = function(e){
        if(!this.mouseDown){
            return;
        }
        var movement = new b2.Vec2(
            e.movementX || e.mozMovementX || e.webkitMovementX || 0,
            e.movementY || e.mozMovementY || e.webkitMovementY || 0
        );
        movement.Multiply(1/this.scale);
        this.center.Subtract(movement);
    };
    
    Box2dDebugDraw.prototype.onmousewheel = function(e){
        var delta = e.detail ? e.detail * (-120) : e.wheelDelta;
        if(delta >= 0){
            this.scale++;
        }else{
            this.scale--;
            if(this.scale <= 0){
                this.scale = 1;
            }
        }
        e.preventDefault();
        return false;
    }
    
    return Box2dDebugDraw;
})