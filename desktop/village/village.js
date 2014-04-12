define([
'configs/client', 
'vendors/utili/q',
'general/utili/mathHelper',
'desktop/patcher/resourceController',
'desktop/patcher/patcher',
'three',
'box2d',
'vendors/utili/async',
'desktop/utili/debug',
'desktop/utili/box2dDebugDraw',
'desktop/village/GameObjects/GameObject',
'desktop/village/GameObjects/StaticObject',
'desktop/village/GameObjects/EnvironmentObject',
'desktop/village/GameObjects/BuildingObject',
'desktop/village/GameObjects/NPCObject',
'desktop/village/GameObjects/DynamicObject',
'desktop/village/GameObjects/MonsterObject',
'desktop/village/GameObjects/UserObject',
'desktop/village/GameObjects/PlayerObject',
], function(config, Q, MathHelper, resourceController, patcher, THREE, b2, async, debug, Box2dDebugDraw, 
GameObject, 
StaticObject, 
EnvironmentObject,
BuildingObject,
NPCObject,
DynamicObject,
MonsterObject,
UserObject,
PlayerObject
){
    function Village(socket){
        this.socket = socket;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            45,
            16/9,
            0.001,
            1000
        );
        
        this.camera.position.y = 3.2; 
        this.camera.position.z = -3.6;
        
        this.cameraContainer = new THREE.Object3D();
        this.cameraContainer.add(this.camera);
        
        this.scene.add(this.cameraContainer);
        
        this.targetOffset = new THREE.Vector3(0, 1.5, 0.5);
        this.cameraTargetDamp = 5;
        this.cameraDestRotation = 0;
        this.cameraRotationSpeed = THREE.Math.degToRad(360/5) / 1000;
        this.cameraRotationMaxSpeed = THREE.Math.degToRad(6);
        this.cameraRotationDamp = 8;
        this.cameraHeightDamp = 14;
        this.cameraDestHeight = 3.2;
        this.cameraHeightResetDamp = 70;
        this.cameraHeightMoveSpeed = 2.8 / 1000;
        this.cameraMaxHeight = 6;
        this.cameraMinHeight = 0.5;
        this.cameraNormalHeight = 3.2;
        
        this.heightCollider = [];
        
        this.player = false;
        
        this.addDefaultLighting();
        this.addTerrain();
        
        this.world = new b2.World(
            new b2.Vec2(0, 0),  //gravity
            true                //allow sleep
        );
        if(config.box2dDebugDraw){
            this.debugDraw = new Box2dDebugDraw(this.world);
        }
        
        this.VIDMap = {};
        this.children = [];
        
        this.resize(window.innerWidth, window.innerHeight);
        
        this.socket.on('disconnect', this.ondisconnect.bind(this));
        this.socket.on('updatePackage', this.onUpdatePackage.bind(this));
        this.socket.on('resetPosition', this.onResetPosition.bind(this));
    }
    
    Village.prototype.addTerrain = function(){
        var geometry = new THREE.PlaneGeometry(50, 50, 50, 50);
        var material = new THREE.MeshLambertMaterial( {color: 0xDDDDDD, side: THREE.DoubleSide} );
        var terrain = new THREE.Mesh(geometry, material);
        terrain.resiveShadow = true;
        terrain.rotation.x = THREE.Math.degToRad(90);
        this.scene.add(terrain);
        this.heightCollider.push(terrain);
    };
    
    Village.prototype.addGameObjects = function(package){
        return Q.Promise((function(resolve, reject, progress){
            var i = 0;
            async.eachLimit(package, 1, (function(data, callback){
                var VID = data.VID;
                var instaneType = data.instanceType;
                var gameObjectName = data.type;
                
                var gameObjectClass = Village.getClassForType(instaneType);
                resourceController.loadGameObject(gameObjectName, true, gameObjectClass)
                .then((function(gameObject){
                    
                    gameObject.VID = VID;
                    this.add(gameObject);
                    gameObject.onStartData(data);
                    
                }).bind(this)).finally(function(){
                    //progress
                    progress(++i / package.length);
                    callback();
                }).done();
                
                
                
            }).bind(this), function(){
                resolve();
            });
        }).bind(this));
    };
    
    Village.prototype.ondisconnect = function(){
        console.log("disconnect");
        this.destroy();
    };
    
    Village.prototype.onUpdatePackage = function(package){
        if(package.add){
            this.addGameObjects(package.add);
        }
        if(package.dif){
            this.applyDifPackage(package.dif);
        }
        if(package.remove){
            this.applyRemovePackage(package.remove);
        }
        this.sendServerPingPackage(package.time);
    };
    
    Village.prototype.onResetPosition = function(position){
        this.player.setPosition(position.x, position.y);
    }
    
    Village.prototype.sendServerPingPackage = function(time){
        this.socket.emit('serverPingPackage', time);
    }
    
    Village.prototype.applyDifPackage = function(package){
        for(var VID in package){
            var gameObject = this.getByVID(VID);
            if(gameObject){
                var difPackage = package[VID];
                gameObject.onDifData(difPackage);
            }
        }
    };
    
    Village.prototype.applyRemovePackage = function(package){
        package.forEach(function(VID){
            var gameObject = this.getByVID(VID);
            this.remove(gameObject);
        }, this);
    };
    
    Village.prototype.sendServerUpdatePackage = function(){
        var data = {
            position : this.player.body.GetPosition(),
            velocity : this.player.body.GetLinearVelocity(),
            destRotation : this.player.destRotation,
        };
        this.socket.emit('serverUpdatePackage', data);
    };
    
    Village.prototype.setPlayer = function(playerObject){
        this.player = playerObject;
        //Camera Start Position
        var target = this.player.model;
        //var newPos = this.getNewCameraPosition(target, this.cameraOffset.clone().multiplyScalar(3), new THREE.Vector2(0,0));
        //this.camera.position = newPos;
    };
    
    Village.prototype.resize = function(width, height){
        this.camera.aspect = width/height;
        this.camera.updateProjectionMatrix();
    };
    
    var zeroVector2 = new THREE.Vector2(0, 0);
    
    Village.prototype.update = function(time, deltaTime, characterController){
        this.characterController = characterController;
        if(this.player){
            this.updateCamera(time, deltaTime, characterController);
            this.player.updateVelocity(time, deltaTime, this, characterController);
            
            
        }
        
        this.forEach(function(gameObject){
            gameObject.update(time, deltaTime, this);
        }, this);
        this.world.Step(deltaTime/1000, 10, 10);
        this.sendServerUpdatePackage();
    };
    
    Village.prototype.animate = function(time, deltaTime, characterController){
        this.forEach(function(gameObject){
            gameObject.animate(time, deltaTime, this);
        }, this);
        
        //window.world = this.world;
        
        if(config.box2dDebugDraw){
            this.debugDraw.draw();
        }
    };
    
    
    
    Village.prototype.updateCameraTarget = (function(){
        
        var matrix = new THREE.Matrix4();
        
        return function(time, deltaTime, characterController){
            var target = this.player.model;
            
            var targetPosition = target.position;
            var dif = targetPosition.clone().sub(this.cameraContainer.position);
            
            
            this.cameraContainer.position.add(
                dif.divideScalar(this.cameraTargetDamp)
            );
            
            
            matrix.lookAt(
                targetPosition.clone().add(this.camera.position),
                target.position.clone().add(this.targetOffset),
                this.camera.up
            );
            
            this.camera.setRotationFromMatrix(matrix);
        }
        
    })();
    
    Village.prototype.updateCameraRotationAndHeight = function(time, deltaTime, characterController){
        var cameraVelocity = characterController.cameraVelocity;
        
        // reset Camera height
        var restHeightDif = this.cameraNormalHeight - this.cameraDestHeight;
        this.cameraDestHeight += restHeightDif / this.cameraHeightResetDamp;
        
        // controller camera movment
        if(!cameraVelocity.equals(zeroVector2)){
            // camera rotation
            var rotationSpeed = cameraVelocity.x * -1;
            this.cameraDestRotation = MathHelper.rotateToDest(
                this.cameraDestRotation,
                MathHelper.convertAngle(this.cameraDestRotation + (rotationSpeed * this.cameraRotationSpeed * deltaTime)),
                this.cameraRotationMaxSpeed
            );
            
            // camera height
            var heightSpeed = cameraVelocity.y;
            
            if(heightSpeed !== 0){
                heightChanged = true;
            }
            
            this.cameraDestHeight = MathHelper.inRange(
                this.cameraMinHeight, 
                this.cameraMaxHeight, 
                this.cameraDestHeight + (heightSpeed * this.cameraHeightMoveSpeed * deltaTime)
            );
            
        
        // "auto" camera movement
        }else if(!characterController.movementVelocity.equals(zeroVector2)){
            // camera rotation
            var charRotation = this.player.getRotation();
            this.cameraDestRotation = MathHelper.rotateToDestDamped(
                this.cameraDestRotation,
                charRotation,
                this.cameraRotationMaxSpeed,
                this.cameraRotationDamp
            );
        }
        
        
        
        
        var difHeight = this.cameraDestHeight - this.camera.position.y;
        this.camera.position.y += difHeight / this.cameraHeightDamp;
        
        
        
        this.cameraContainer.rotation.y = MathHelper.rotateToDestDamped(
            this.cameraContainer.rotation.y, 
            this.cameraDestRotation, 
            this.cameraRotationMaxSpeed, 
            this.cameraRotationDamp
        );
    }
    
    Village.prototype.updateCamera = function(time, deltaTime, characterController){
        //Camera
        
        this.updateCameraTarget(time, deltaTime, characterController);
        this.updateCameraRotationAndHeight(time, deltaTime, characterController);
        
    };
    
    var zeroVector3 = new THREE.Vector3(0,0,0);
    
    Village.prototype.addDefaultLighting = function(){
        // LIGHTS

        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        hemiLight.color.setHSL( 0.6, 1, 0.6 );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 500, 0 );
        this.scene.add( hemiLight );
        
        //
        
        var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        dirLight.color.setHSL( 0.1, 1, 0.95 );
        dirLight.position.set( -1, 1.75, 1 );
        dirLight.position.multiplyScalar( 50 );
        dirLight.castShadow = true;
        dirLight.shadowDarkness = 0.5;
        this.scene.add( dirLight );
    };
    
    Village.prototype.add = function(gameObject){
        if(gameObject.model){
            gameObject.model.castShadow = true;
            this.scene.add(gameObject.model);
        }
        
        if(gameObject.bodyDef){
            gameObject.createBody(this.world);
        }
        
        if(gameObject.heightCollider){
            this.heightCollider.push(gameObject.heightCollider);
        }
        
        this.children.push(gameObject);
        var vid = gameObject.VID;
        this.VIDMap[vid] = gameObject;
        return true;
    };
    Village.prototype.remove = function(gameObject, dispose){
        if(dispose === undefined){
            dispose = true;
        }
        var index = this.children.indexOf(gameObject);
        // found
        if(index !== -1){
            
            this.children.splice(index, 1);
            
            var vid = gameObject.VID;
            delete this.VIDMap[vid];
            
            //remove from scene
            if(gameObject.model){
                this.scene.remove(gameObject.model);
            }
            
            //remove height collider
            if(gameObject.heightCollider){
                var colliderIndex = this.heightCollider.indexOf(gameObject.heightCollider);
                if(colliderIndex !== -1){
                    this.heightCollider.splice(colliderIndex, 1);
                }
            }
            
            //remove body from world
            gameObject.removeBody();
            
            if(dispose){
                gameObject.dispose();
            }
            return true;
        }else{
            return false;
        }
    };
    
    Village.prototype.getByVID = function(vid){
        return this.VIDMap[vid] || false;
    };
    
    Village.prototype.forEach = function(){
        this.children.forEach.apply(this.children, arguments);
    };
    
    Village.prototype.destroy = function(){
        this.socket.disconnect();
        this.socket.removeAllListeners();
        this.forEach(function(gameObject) {
            this.remove(gameObject, true);
        }, this);
    };
    
    Village.getClassForType = function(type){
        switch (type) {
            case 'EnvironmentObject':
                return EnvironmentObject;
            case 'MonsterObject':
                return MonsterObject;
            case 'UserObject':
                return UserObject;
            case 'PlayerObject':
                return PlayerObject;
            default:
                return GameObject;
        }
    };
    
    return Village;
});