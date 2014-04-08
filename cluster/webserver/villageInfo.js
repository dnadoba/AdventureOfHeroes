if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'cluster/config',
'vendors/utili/q',
'vendors/utili/path',
'cluster/webserver/express',
'cluster/mysqlPool',
], function(config, Q, urlPath, app, mysqlPool){
    
    var query = Q.denodeify(mysqlPool.query.bind(mysqlPool));
    
    function createVillageInfo(villageId){
        return query("SELECT * FROM village WHERE id = ?", [villageId])
            .then(function(args){
                var rows = args[0];
                var village = rows[0] || {};
                return {
                    name : village.name || '',
                    loadingImage : village.loadingImage || config.get('defaultVillageLoadingImage'),
                    theme : village.theme || config.get('defaulTheme'),
                };
            });
    }
    
    app.get('/village/info.js', function(req, res){
        var villageId = req.query.villageId;
        createVillageInfo(villageId).then(function(info){
            res.header('Content-type', 'application/json');
            if(config.get('debug')){
                res.send(JSON.stringify(info, null, 4));
            }else{
                res.send(JSON.stringify(info));
            }
        });
    });
});