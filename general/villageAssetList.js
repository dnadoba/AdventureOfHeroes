if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'vendors/utili/path',
'cluster/masterClient',
], function(Q, urlPath, master){
    
    function generalVillageAssets(config, query, addAsset, villageId){
        return query("SELECT * FROM village WHERE id = ?", [villageId])
            .then(function(args){
                var rows = args[0];
                var data = rows[0] || {};
                
                // loading image
                addAsset(data.loadingImage || config.get('defaultVillageLoadingImage'));
            });
    }
    
    function buildingAndEnvAssets(config, query, addAsset, villageId){
        var modelsPath = config.get('modelsPath');
        var gameObjectsPath = config.get('gameObjectsPath');
        
        var tables = ['villageBuilding', 'villageEnvironment'];
        var promises = tables.map(function(tableName){
            return query('SELECT DISTINCT type FROM ?? WHERE vid = ?', [tableName, villageId])
                .then(function(args){
                    var rows = args[0];
                    rows.forEach(function(row){
                        var asset = urlPath.join(gameObjectsPath, row.type + '.js');
                        addAsset(asset);
                    });
                });

        });
        return Q.all(promises);
    }
    
    function userAssets(config, mysqlPool, addAsset, villageId){
        return master.getVillageUserList(villageId)
            .then(function(userList){
                // TODO
            });
    }
    
    function createVillageAssetList(config, mysqlPool, villageId){
        
        var query = Q.denodeify(mysqlPool.query.bind(mysqlPool));
        
        var assets = [];
        
        function addAsset(asset){
            if(assets.indexOf(asset) === -1){
                assets.push(asset);
            }
        }
        
        var functions = [
            generalVillageAssets,
            buildingAndEnvAssets,
            userAssets,
        ];
        
        var promises = functions.map(function(func){
            return func(config, query, addAsset, villageId);
        });
        
        return Q.all(promises)
        .then(function(){
            return assets;
        });
    }
    return {
        create : createVillageAssetList,
    };
});