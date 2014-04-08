if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
/**
 * create an instance of ConfigPool for clusterConfig and mainConfig
 */
define(
    ['general/utili/configPool.js', '../configs/main.json', '../configs/cluster.json'],
    function(ConfigPool, mainConfig, clusterConfig){
        var configPool = new ConfigPool(clusterConfig, mainConfig);
        
        return configPool;
    }
);

