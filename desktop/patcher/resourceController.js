define([
'configs/client', 
'vendors/utili/q',
'vendors/utili/path',
'desktop/patcher/patcher',
'desktop/patcher/loadModel',
'three'
], function(config, Q, path, patcher, JSONLoader, THREE){
    function ResourceController(){
        this.modelLoader = new JSONLoader(this);
    }
    
    ResourceController.prototype.loadGameObject = function(gameObjectPath, onlyName, instance){
        if(onlyName){
            gameObjectPath = path.join(config.gameObjectsPath, gameObjectPath + '.js');
        }
        return this.loadJSON(gameObjectPath).then((function(gameObject){
            var promises = [];
            
            if(gameObject.model){
                promises.push(this.loadModel(gameObject.model, true));
            }
            
            if(gameObject.heightCollider){
                promises.push(this.loadModel(gameObject.heightCollider, true));
            }
            
            return Q.all(promises).then(function(data){
                var i = 0;
                var object = new instance();
                
                // model
                if(gameObject.model){
                    var model = data[i++];
                    if(model.materials.length == 1){
                        object.model = new THREE.Mesh(model.geometry, model.materials[0]);
                    }else{
                        object.model = new THREE.Mesh(model.geometry, THREE.MeshFaceMaterial(model.materials));
                    }
                    
                }
                
                // heightCollider
                if(gameObject.heightCollider){
                    var heightCollider = data[i++]
                    object.heightCollider = new THREE.Mesh(heightCollider.geometry);
                }
                
                // box2d body def
                if(gameObject.bodyDef){
                    object.bodyDef = gameObject.bodyDef;
                }
                
                return object;
                
            });
        }).bind(this));
    };
    
    ResourceController.prototype.loadModel = function(modelPath, onlyName){
        if(onlyName){
            modelPath = path.join(config.modelsPath, modelPath + '.js');
        }
        return this.loadJSON(modelPath).then((function(model){
            var texturePath = path.dirname(modelPath) + '/';
            return this.modelLoader.parse(model, texturePath);
        }).bind(this));
    };
    
    ResourceController.prototype.loadFixture = function(){
        
    };
    
    ResourceController.prototype.loadImage = function(imagePath){
        return patcher.getAssetURL(imagePath).then(function(url){
            return Q.Promise(function(resolve, reject) {
                var image = new Image();
                image.onload = function(){
                    resolve(image);
                };
                image.onerror = function(){
                    reject();
                };
                image.src = url;
            });
        });
    };
    
    ResourceController.prototype.loadJSON = function(jsonPath){
        return this.loadText(jsonPath).then(JSON.parse).catch(function(error){
            console.error('Error in JSON File "' + jsonPath + '"', error);
        });

    };
    ResourceController.prototype.loadText = function(textPath){
        return patcher.downloadAsset(textPath)
        .then(patcher.requestFileSystem.bind(patcher))
        .then(function(fs){
            return Q.Promise(function(resolve, reject){
                fs.root.getFile(textPath, {}, function(fileEntry){
                    fileEntry.file(function(file){
                        var reader = new FileReader();
                        reader.onloadend = function(e){
                            resolve(this.result);
                        };
                        reader.onerror = function(e){
                            console.log(e);
                            reject();
                        };
                        reader.readAsText(file);
                    }, reject);
                }, reject);
            });
        });
    };
    
    return new ResourceController();
});