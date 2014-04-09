if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([], function(){
    var config = {
        version : 1,
        debug : true,
        box2dDebugDraw : true,
        showStats : true,
        speedHack : false,
        deleteAllFiles : false,
        neededQuata : 1024 * 1024 * 20,
        maxSimultaneousDownloads : 2,
        assetPath : '/assets',
        gameObjectsPath : '/gameObjects',
        modelsPath : '/models',
    };
    return config;
});