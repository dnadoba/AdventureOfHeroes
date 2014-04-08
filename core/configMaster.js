if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
/**
 * create an instance of ConfigPool for coreMasterConfig, coreConfig and mainConfig
 */
define(
    ['general/utili/configPool.js', '../configs/main.json', '../configs/core.json', '../configs/coreMaster.json'],
    function(ConfigPool, mainConfig, coreConfig, coreMasterConfig){
        var configPool = new ConfigPool(coreMasterConfig, coreConfig, mainConfig);
        
        return configPool;
    }
);

