if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
/**
 * create an instance of ConfigPool for coreSlaveConfig, coreConfig and mainConfig
 */
define(
    ['general/utili/configPool.js', '../configs/main.json', '../configs/core.json', '../configs/coreSlave.json'],
    function(ConfigPool, mainConfig, coreConfig, coreSlaveConfig){
        var configPool = new ConfigPool(coreSlaveConfig, coreConfig, mainConfig);
        
        return configPool;
    }
);

