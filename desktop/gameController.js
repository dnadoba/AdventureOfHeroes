define([
'vendors/utili/q',
'configs/client',
'desktop/patcher/patcher',
'general/utili/xhr',
'vendors/utili/path',
'socket.io',
'desktop/patcher/assetDownloadController',
'desktop/village/village',
'vendors/utili/async',
'desktop/patcher/resourceController',
'general/utili/now',
'general/utili/requestAnimationFrame',
'three',
'desktop/game/characterController',
'desktop/utili/debug',
'stats',
], function(Q, config, patcher, Xhr, path, io, AssetDownloadController, Village, async, resourceController, now, requestAnimationFrame, THREE, characterController, debug, Stats){
    function GameController(){
        this.renderer = new THREE.WebGLRenderer({
            canvas : document.getElementById('gameCanvas'),
            //precision : 'mediump', // shader precision, can be "highp", "mediump" or "lowp"
            //alpha : false, // Boolean, default is false
            //premultipliedAlpha : true, // Boolean, default is true
            //antialias : true, // Boolean, default is false
            //stencil : true // Boolean, default is true
            //preserveDrawingBuffer : false, // Boolean, default is false
            maxLights : 10, //default is 4
        })
        this.renderer.shadowMapEnabled = true;
        // to antialias the shadow
        this.renderer.shadowMapSoft = true;
        
        this.renderer.autoClear = true;
        this.renderer.setClearColor( 0xcccccc, 1);
        
        this.village = false;
        this.lastTime = now();
        
        this.characterController = characterController;
        console.log(this.characterController);
        
        this.hasResize = false;
        this.width = 0;
        this.height = 0;
        if(config.showStats){
            this.stats = new Stats();
            this.stats.setMode(2);
            this.stats.domElement.style.position = "absolute";
            this.stats.domElement.style.left = 0;
            this.stats.domElement.style.bottom = 0;
            document.body.appendChild(this.stats.domElement);
        }
        
        this.onresize();
        window.addEventListener('resize', this.onresize.bind(this));
        requestAnimationFrame(this.onframe.bind(this));
    }
    
    GameController.prototype.onframe = function(){
        var time = now();
        var deltaTime = time - this.lastTime;
        var frameRate = 1000/deltaTime;
        
        if(config.showStats){
            this.stats.begin();
        }
        
        this.lastTime = time;
        if(this.hasResize){
            this.resize();
            this.hasResize = false;
        }
        this.characterController.update();
        this.update(time, deltaTime, this.characterController);
        this.animate(time, deltaTime, this.characterController);
        
        if(config.showStats){
            this.stats.end();
        }
        
        requestAnimationFrame(this.onframe.bind(this));
    };
    
    GameController.prototype.onresize = function(){
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.hasResize = true;
    }
    
    GameController.prototype.resize = function(){
        this.renderer.setSize(this.width, this.height);
        if(this.village){
            this.village.resize(this.width, this.height);
        }
    }
    
    GameController.prototype.update = function(time, deltaTime, characterController){
        if(this.village){
            this.village.update(time, deltaTime, characterController);
        }
    };
    GameController.prototype.animate = function(time, deltaTime, characterController){
        if(this.village){
            this.village.animate(time, deltaTime, characterController);
            this.renderer.render(this.village.scene, this.village.camera);
        }
        
        
    };
    
    GameController.prototype.destroyVillage = function(){
        if(this.village){
            this.village.destroy();
        }
    };
    
    GameController.prototype.download = function(villageId){
        return Q.all([
            Xhr.getJSON('/assets/villageList.js?villageId=' + villageId),
            Xhr.getJSON('/village/info.js?villageId=' + villageId),
        ])
        .spread(function(assetList, villageInfo){
            return patcher.ready.then(function(){
                var loadingImage = patcher.getAssetURL(villageInfo.loadingImage, 1024 * 1024);
                var assets = patcher.getAllNotLoadedAssets(assetList);
                return {
                    assetDownloadController : assets.length ? new AssetDownloadController(assets) : false,
                    villageInfo : villageInfo,
                    loadingImage : loadingImage,
                };
            });
        });
    };
    
    GameController.prototype.createSocket = function(hostInfo, villageId, sessionHash){
        var url = location.protocol + '//' + hostInfo.address + ':' + hostInfo.port;
        var socket = io.connect(url, {
            query : 'villageId=' + villageId + '&hash=' + sessionHash,
            'force new connection' : true,
        });
        return socket;
    };
    
    GameController.prototype.createVillage = function(socket, startPackage){
        var village = new Village(socket);
        var userVID = startPackage.userVID;
        var add = startPackage.add;
        return village.addGameObjects(add).then(function(){
            var player = village.getByVID(userVID);
            village.setPlayer(player);
            socket.emit('loaded');
            return village;
        })
        .then((function(village){
            this.village = village;
            return village;
        }).bind(this));
        
        
    };
    
    return new GameController();
});