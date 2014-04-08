
var requirejs = require("requirejs");

requirejs([
'core/configMaster',
'core/master/server',
'vendors/utili/q'
], 
function(config, MasterServer, Q){
    var masterServer = new MasterServer(
        config.get('masterServer.portForSlaves'),
        config.get('masterServer.portForCluster'),
        config.get('masterServer.address'),
        config.get('masterServer.authKey'),
        config.get('debug')
    );
    masterServer.setWhiteList(config.get('whitelist'));
});